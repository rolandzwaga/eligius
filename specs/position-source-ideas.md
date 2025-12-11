# Position Source Ideas

Reference document for potential timeline position source implementations beyond the existing RAF, Video, and Scroll sources.

## Existing Implementations

| Source | Type | Description |
|--------|------|-------------|
| RafPositionSource | Temporal | Time-based, driven by requestAnimationFrame |
| VideoPositionSource | Media | Position driven by video/audio playback |
| ScrollPositionSource | Spatial | Position driven by scroll offset within element |

---

## Spatial/Interaction-Based Sources

### MousePositionSource
**Concept**: Map mouse/pointer position to timeline position.

- **Axis modes**: Horizontal (X), Vertical (Y), or both
- **Scope**: Viewport-relative, element-relative, or document-relative
- **Use cases**:
  - Interactive infographics that respond to cursor movement
  - Parallax effects with precise control
  - Reveal-on-hover animations
  - Scrubbing UI controls

### TouchDragSource
**Concept**: Drag gesture along a defined axis or path.

- User drags to scrub through timeline
- Momentum/inertia support for natural feel
- Snap points for discrete positions
- **Use cases**:
  - Mobile-friendly timeline scrubbing
  - Swipe-through presentations
  - Before/after image comparisons

### CursorProximitySource
**Concept**: Position based on distance from cursor to a target element.

- Closer = higher position value (or inverse)
- Smooth falloff based on distance
- **Use cases**:
  - Hover-to-reveal effects with graduated intensity
  - Interactive "magnetic" UI elements
  - Attention-following animations

### IntersectionSource
**Concept**: Position based on element visibility percentage using Intersection Observer.

- 0% visible = position 0, 100% visible = position at duration
- Configurable threshold granularity
- **Use cases**:
  - Scroll-triggered animations without scroll listener overhead
  - Lazy-loading content with animated reveals
  - Progress indicators for content visibility

### ResizeSource
**Concept**: Position based on element or viewport size.

- Map width/height to position range
- Useful for responsive animations
- **Use cases**:
  - Responsive layout transitions
  - Container query-like animation behaviors
  - Size-aware UI adaptations

---

## Device Sensor Sources

### DeviceOrientationSource
**Concept**: Use gyroscope/accelerometer data for position.

- Map device tilt (alpha/beta/gamma) to timeline position
- Single axis or combined
- **Use cases**:
  - Tilt-to-reveal effects on mobile
  - 360-degree product viewers
  - Immersive storytelling experiences
  - Parallax based on device orientation

### DeviceMotionSource
**Concept**: Position based on device acceleration/movement.

- Shake detection for discrete jumps
- Continuous motion for smooth scrubbing
- **Use cases**:
  - Shake-to-reveal easter eggs
  - Motion-controlled presentations
  - Physical interaction triggers

### AmbientLightSource
**Concept**: Use ambient light sensor to drive position.

- Bright environment = different position than dark
- Smooth transitions as lighting changes
- **Use cases**:
  - Day/night theme transitions
  - Environment-aware UI adaptations
  - Art installations responding to lighting

### GeolocationSource
**Concept**: Position based on GPS coordinates or distance from a point.

- Distance from target location maps to position
- Speed-based variants
- **Use cases**:
  - Location-based experiences
  - Proximity-triggered content
  - Journey/travel visualizations

---

## Input Device Sources

### GamepadSource
**Concept**: Use gamepad analog sticks or triggers for position.

- Analog stick X/Y for 2D control
- Trigger pressure for 1D control
- **Use cases**:
  - Game-like interactive experiences
  - Accessible alternative controls
  - Kiosk/installation interactions

### KeyboardStepSource
**Concept**: Discrete stepping through timeline via keyboard.

- Arrow keys step forward/backward
- Configurable step size
- Home/End for jump to start/end
- **Use cases**:
  - Presentation mode
  - Accessible timeline navigation
  - Frame-by-frame animation review
  - Slide-based content

### SliderInputSource
**Concept**: HTML range input or custom slider drives position.

- Direct mapping from input value to position
- Support for any numeric input type
- **Use cases**:
  - Custom video-like scrubbers
  - Interactive tutorials with manual control
  - Parameter exploration interfaces

---

## Audio Sources

### AudioLevelSource
**Concept**: Position driven by audio input volume/amplitude.

- Microphone input or audio element analysis
- Peak detection, RMS, or envelope following
- **Use cases**:
  - Voice-activated animations
  - Audio visualizers
  - Reactive music experiences
  - Accessibility features for deaf users (visual feedback)

### AudioFrequencySource
**Concept**: Position based on dominant frequency or frequency band.

- FFT analysis of audio input
- Map frequency ranges to positions
- **Use cases**:
  - Music visualizations
  - Audio-reactive art
  - Sound-based interactions

### BeatDetectionSource
**Concept**: Jump to positions on detected beats.

- BPM detection and synchronization
- Quantized position jumps
- **Use cases**:
  - Music videos
  - Rhythmic animations
  - Dance/club visualizations

---

## External Data Sources

### WebSocketSource
**Concept**: Position driven by real-time external data stream.

- Server pushes position updates
- Normalized value mapping
- **Use cases**:
  - Synchronized multi-user experiences
  - Live data visualizations
  - Remote-controlled presentations
  - IoT sensor data visualization

### APIPollingSource
**Concept**: Position based on periodically fetched API data.

- Map API response values to position
- Configurable polling interval
- **Use cases**:
  - Stock ticker animations
  - Weather-based themes
  - Social media metrics visualization
  - Live sports score reactions

### MQTTSource
**Concept**: Position driven by MQTT messages (IoT protocol).

- Subscribe to topic, map payloads to position
- **Use cases**:
  - IoT dashboards
  - Smart home visualizations
  - Industrial monitoring displays

---

## Time-Based Variants

### ScheduledSource
**Concept**: Position based on real-world time/date.

- Map time of day to position (midnight=0, noon=0.5, etc.)
- Date-based positioning for calendars
- **Use cases**:
  - Day/night cycles in interfaces
  - Seasonal theme changes
  - Time-aware dashboards

### CountdownSource
**Concept**: Position counts down to a target datetime.

- Reverse temporal progression
- Event-based timelines
- **Use cases**:
  - Launch countdowns
  - Event timers
  - Deadline visualizations

### MetronomeSource
**Concept**: Position oscillates at a fixed BPM.

- Configurable tempo
- Waveform shape (sine, triangle, square)
- **Use cases**:
  - Rhythmic animations
  - Pulsing effects
  - Loading indicators with tempo

---

## Composite/Advanced Sources

### MultiSourceBlender
**Concept**: Combine multiple position sources with weighted blending.

- Smooth transitions between sources
- Priority/override modes
- **Use cases**:
  - Fallback chains (mouse → touch → keyboard)
  - Hybrid interaction modes
  - Progressive enhancement

### GestureSource
**Concept**: Position based on recognized gestures (camera-based).

- Hand tracking via MediaPipe or similar
- Predefined gesture → position mappings
- **Use cases**:
  - Touchless interfaces
  - Accessibility features
  - Art installations
  - Kiosk applications

### SpeechCommandSource
**Concept**: Voice commands trigger discrete position changes.

- "Next", "Previous", "Go to chapter 3"
- Web Speech API integration
- **Use cases**:
  - Hands-free navigation
  - Accessibility
  - Voice-controlled presentations

### BiometricSource
**Concept**: Position driven by heart rate, breathing, etc.

- Wearable device integration
- Calm/excited state mapping
- **Use cases**:
  - Meditation/breathing apps
  - Fitness visualizations
  - Stress-responsive interfaces

---

## Implementation Priority Suggestions

### High Value / Lower Complexity
1. **MousePositionSource** - Common interaction pattern, straightforward implementation
2. **KeyboardStepSource** - Essential for accessibility, simple discrete stepping
3. **IntersectionSource** - Modern API, performance benefits over scroll
4. **SliderInputSource** - Direct user control, simple mapping

### Medium Value / Medium Complexity
5. **DeviceOrientationSource** - Good mobile experience, requires permission handling
6. **TouchDragSource** - Important for mobile, needs momentum physics
7. **AudioLevelSource** - Engaging for interactive experiences, needs Web Audio API
8. **WebSocketSource** - Enables collaborative/synchronized experiences

### Experimental / Higher Complexity
9. **GestureSource** - Requires ML libraries, emerging technology
10. **BiometricSource** - Limited device support, privacy considerations
11. **MultiSourceBlender** - Architectural complexity, but enables advanced UX

---

## Common Interface Requirements

All position sources should implement `IPositionSource` with:

```typescript
interface IPositionSource {
  readonly state: TSourceState;
  loop: boolean;

  init(): Promise<void>;
  destroy(): void;

  activate(): Promise<void>;
  suspend(): void;
  deactivate(): void;

  getPosition(): number;
  getDuration(): number;

  onPosition(callback: (position: number) => void): void;
  onBoundaryReached(callback: (boundary: TBoundary) => void): void;
  onActivated(callback: () => void): void;
}
```

Seekable sources additionally implement `ISeekable`:

```typescript
interface ISeekable {
  seek(position: number): Promise<number>;
}
```

---

## Notes

- Position sources should normalize their values to the configured duration
- Consider debouncing/throttling for high-frequency inputs (mouse, sensors)
- Permission handling is critical for device sensors and media inputs
- Graceful degradation when APIs are unavailable
- Battery/performance impact for continuous sensor polling
