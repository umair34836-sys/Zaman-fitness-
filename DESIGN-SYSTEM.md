# Zaman Fitness — Design System Notes

## Reference
Primary reference: user-supplied 11.76s mobile product video.

## UI direction
- Light, minimal fitness dashboard
- Olive green primary action color
- Warm neutral/white surfaces
- High-radius cards and compact metric tiles
- Strong Manrope headings + readable DM Sans body
- Mobile-first 384×832 composition, expanding responsively on desktop
- Bottom navigation for core app areas
- Desktop admin dashboard is intentionally denser than the consumer app

## UI/UX Pro Max source alignment
The supplied UI/UX Pro Max v2.13.0 source identifies Fitness/Gym App as a progress-tracking, workout-plan, achievement and motivational product. Its catalog recommends energetic green/orange accents and motion-oriented interactions. For this prototype, the supplied video takes priority for the exact visual treatment, so the orange is kept as a secondary status/accent color while olive green drives the interface.

Accessibility details implemented from the supplied guidance:
- visible focus states through browser focus + component contrast
- reduced-motion media query
- semantic buttons for interactive controls
- text reflow without fixed-width clipping
- no emoji-only navigation icons; navigation uses inline SVG
