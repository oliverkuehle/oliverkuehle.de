---
title: Virtual Drums for Apple Vision Pro
published: true
date: 2026-01-15
keywords:
  - Projects
---

Over the past two months, we've been evaluating the Apple Vision Pro by building a virtual drum kit. Instead of creating a perfect instrument, we wanted to understand where the device's current practical limitations actually lie. We chose a drum kit, because it demands fast, precise and full-body interactions – and it's fun.

→ [**You can download and test it right now in the App Store**](https://apps.apple.com/de/app/virtual-drums/id6756814388)

:::columns 
![Screen reader alt](/resources/virtual-drums-drums.jpg)

![Screen reader alt](/resources/virtual-drums-playing.jpg)
:::

## Working around the limitations

The most obvious limitation is the lack of physical feedback, because there's simply nothing to hit. We tried to compensate through strong visual and auditory cues: detailed drum models, realistic shading, dynamic hit animations, and spatial audio that adapts to both hit location and intensity.

Foot control was another challenge, since visionOS provides no native foot tracking. Our first workaround was a 3D-printed pedal combined with the analog triggers of a PS4 controller. With limited time until the THA project day, we only managed a first prototype — but it worked just fine, and thanks to some duct tape, it even survived the whole day ;)

:::small
![Screen reader alt](/resources/virtual-drums-pedal.jpg)
:::

## What we learned from real users

During the project day, we deliberately used our stall to watch people interact with the system and gather as much feedback as possible. Seeing both experienced drummers and complete beginners test the setup led to a handful of valuable observations:

- **Standalone hand tracking was more limiting than expected** — particularly when hands left the camera's field of view, occluded each other, or moved at high speed. Interestingly, these issues got more frequent the more immersed someone became.
- **Latency was far more noticeable for acoustic drummers** than for e-drum players, who are already used to a bit of delay.
- **Users frequently undershot their first few hits**, which suggests that stick length and drum distance are genuinely hard to intuitively judge in the headset.

On a personal note, I learned a lot over these weeks and really enjoyed the whole process — coding, presenting, and talking it through with everyone who stopped by. As a non-drummer myself, I had a lot of fun experimenting with possibilites only possible in the virtual environment: especially by scaling the drums from miniature kits that felt almost playful to oversized setups that turned playing into a full-body workout.

## What's next

After my remaining exams, I'm excited to evaluate PSVR2 controllers and spatial styluses to improve latency and stability — and experiment with adding real haptic feedback. I'm also looking forward to build proper foot pedals using microcontrollers, and to add immersive environments like studio or concert settings.

At this stage, the project is still a proof of concept, but it already does what we hoped: it exposes the current limitations of the platform and opens the door to early experimentation with genuinely interesting directions, like drum lessons and MIDI-based music production.
