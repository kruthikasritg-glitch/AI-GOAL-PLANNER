"""
Spider-Sense: Danger Detector
Real-time face detection with visual + audio alerts.
Requirements: pip install opencv-python pygame numpy
"""

import cv2
import numpy as np
import pygame
import sys
import os
import time
# Setup Audio
pygame.mixer.init()
pygame.mixer.music.load("spidey_theme.mp3")
is_playing = False

# ─────────────────────────────────────────────
# CONFIG
# ─────────────────────────────────────────────
WINDOW_TITLE     = "Spider-Sense: Danger Detector"
ALERT_COLOR      = (0, 0, 220)        # BGR: red
SAFE_COLOR        = (0, 200, 50)      # BGR: green
FONT             = cv2.FONT_HERSHEY_SIMPLEX
COOLDOWN_SECS    = 3.0                # seconds before re-triggering sound
HAAR_SCALE       = 1.1
HAAR_NEIGHBORS   = 5
HAAR_MIN_SIZE    = (80, 80)

# ─────────────────────────────────────────────
# AUDIO: generate a synthetic Spider-Sense "tingle"
# ─────────────────────────────────────────────
def generate_spidey_sound(duration=0.6, sample_rate=44100):
    """
    Synthesise a quick rising-chirp alarm using NumPy sine waves.
    Returns a pygame Sound object (no external file needed).
    """
    t = np.linspace(0, duration, int(sample_rate * duration), endpoint=False)

    # Sweeping frequency: 400 Hz → 1200 Hz
    freq = np.linspace(400, 1200, len(t))
    wave = np.sin(2 * np.pi * freq * t)

    # Amplitude envelope: quick attack, slow decay
    envelope = np.exp(-3 * t)
    wave = (wave * envelope * 32767).astype(np.int16)

    # Stereo
    stereo = np.column_stack([wave, wave])
    sound = pygame.sndarray.make_sound(stereo)
    return sound


# ─────────────────────────────────────────────
# VISUAL OVERLAY: jagged red border "tingle"
# ─────────────────────────────────────────────
def draw_tingle_border(frame, intensity=1.0):
    """
    Draw an animated jagged/spiky border around the frame to simulate
    the Spider-Sense 'tingle' effect. intensity ∈ [0, 1].
    """
    h, w = frame.shape[:2]
    overlay = frame.copy()

    # Outer glow rectangles
    for i in range(5):
        thickness = 3 + i * 2
        alpha = 0.6 - i * 0.1
        offset = i * 4
        color = (0, int(50 * alpha), int(220 * alpha))  # BGR reddish glow
        cv2.rectangle(overlay,
                      (offset, offset),
                      (w - offset - 1, h - offset - 1),
                      color, thickness)

    # Jagged spikes along the border
    spike_count = 30
    spike_len   = int(22 * intensity)
    rng         = np.random.default_rng(int(time.time() * 20))  # flicker each call

    for _ in range(spike_count):
        side = rng.integers(0, 4)
        if side == 0:   # top
            x = rng.integers(0, w)
            pt1, pt2 = (x, 0), (x + rng.integers(-10, 10), spike_len)
        elif side == 1: # bottom
            x = rng.integers(0, w)
            pt1, pt2 = (x, h - 1), (x + rng.integers(-10, 10), h - 1 - spike_len)
        elif side == 2: # left
            y = rng.integers(0, h)
            pt1, pt2 = (0, y), (spike_len, y + rng.integers(-10, 10))
        else:           # right
            y = rng.integers(0, h)
            pt1, pt2 = (w - 1, y), (w - 1 - spike_len, y + rng.integers(-10, 10))

        cv2.line(overlay, pt1, pt2, (0, 0, 255), 2, cv2.LINE_AA)

    cv2.addWeighted(overlay, 0.85, frame, 0.15, 0, frame)


def draw_face_boxes(frame, faces):
    """Draw detection boxes around found faces."""
    for (x, y, fw, fh) in faces:
        cv2.rectangle(frame, (x, y), (x + fw, y + fh), ALERT_COLOR, 2)
        cv2.putText(frame, "INTRUDER", (x, y - 8),
                    FONT, 0.55, ALERT_COLOR, 2, cv2.LINE_AA)


def draw_hud(frame, faces_detected, fps):
    h, w = frame.shape[:2]

    # Status pill
    if len(faces_detected) > 0:
        status_text = f"! SPIDER-SENSE TINGLING !  ({len(faces_detected)} detected)"
        status_color = ALERT_COLOR
    else:
        status_text = "ALL CLEAR"
        status_color = SAFE_COLOR

    # Background pill
    (tw, th), _ = cv2.getTextSize(status_text, FONT, 0.65, 2)
    pad = 10
    cv2.rectangle(frame,
                  (w // 2 - tw // 2 - pad, 10),
                  (w // 2 + tw // 2 + pad, 10 + th + pad * 2),
                  (20, 20, 20), -1)
    cv2.putText(frame, status_text,
                (w // 2 - tw // 2, 10 + th + pad),
                FONT, 0.65, status_color, 2, cv2.LINE_AA)

    # FPS counter (bottom-left)
    cv2.putText(frame, f"FPS: {fps:.1f}", (10, h - 10),
                FONT, 0.45, (180, 180, 180), 1, cv2.LINE_AA)

    # Quit hint (bottom-right)
    hint = "Press 'Q' to quit"
    (hw, _), _ = cv2.getTextSize(hint, FONT, 0.4, 1)
    cv2.putText(frame, hint, (w - hw - 10, h - 10),
                FONT, 0.4, (140, 140, 140), 1, cv2.LINE_AA)


# ─────────────────────────────────────────────
# MAIN
# ─────────────────────────────────────────────
def main():
    global is_playing
    # ── Init pygame audio ──────────────────────
    pygame.mixer.pre_init(44100, -16, 2, 512)
    pygame.init()
    alert_sound = generate_spidey_sound()

    # ── Load Haar Cascade ──────────────────────
    cascade_path = cv2.data.haarcascades + "haarcascade_frontalface_default.xml"
    face_cascade = cv2.CascadeClassifier(cascade_path)
    if face_cascade.empty():
        print("[ERROR] Could not load Haar Cascade. Check your OpenCV installation.")
        sys.exit(1)

    # ── Open webcam ────────────────────────────
    cap = cv2.VideoCapture(0)
    if not cap.isOpened():
        print("[ERROR] Cannot access webcam.")
        sys.exit(1)

    cap.set(cv2.CAP_PROP_FRAME_WIDTH,  640)
    cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 480)

    print("[Spider-Sense] Running… Press 'Q' to quit.")

    last_alert_time = 0.0
    prev_time       = time.time()

    while True:
        ret, frame = cap.read()
        if not ret:
            print("[ERROR] Failed to read frame.")
            break

        # ── FPS ──────────────────────────────
        now  = time.time()
        fps  = 1.0 / max(now - prev_time, 1e-6)
        prev_time = now

        # ── Face detection ───────────────────
        gray  = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        gray  = cv2.equalizeHist(gray)          # improve low-light performance
        faces = face_cascade.detectMultiScale(
            gray,
            scaleFactor  = HAAR_SCALE,
            minNeighbors = HAAR_NEIGHBORS,
            minSize      = HAAR_MIN_SIZE,
            flags        = cv2.CASCADE_SCALE_IMAGE
        )

        # ── Alerts ───────────────────────────
        if len(faces) > 0:
            draw_tingle_border(frame)
            draw_face_boxes(frame, faces)

            # — Alerts —
        if len(faces) > 0:
            draw_tingle_border(frame)
            draw_face_boxes(frame, faces)

            # --- NEW MUSIC LOGIC ---
            if not is_playing:
                pygame.mixer.music.play(-1)  # Plays song on loop
                is_playing = True
        else:
            # Stop music when no one is detected
            if is_playing:
                pygame.mixer.music.stop()
                is_playing = False

        # ── HUD ──────────────────────────────
        draw_hud(frame, faces, fps)

        # ── Display ──────────────────────────
        cv2.imshow(WINDOW_TITLE, frame)

        key = cv2.waitKey(1) & 0xFF
        if key == ord('q') or key == ord('Q'):
            print("[Spider-Sense] Shutting down.")
            break

    cap.release()
    cv2.destroyAllWindows()
    pygame.quit()


if __name__ == "__main__":
    main()