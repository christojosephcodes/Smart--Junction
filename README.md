Smart Junction (Intelli-Signal) 🚦
1st Place Winner – CHRISTOVATE 2026

Overview
Smart Junction is an AI-driven traffic management ecosystem designed to replace legacy "fixed-timer" signals with dynamic, data-aware logic. By leveraging real-time density analysis and emergency vehicle prioritization, the system reduces urban congestion and improves emergency response times.

Key Features
Emergency Vehicle Priority (EVP): Automatically detects emergency vehicles within a 500m radius and triggers a "Pre-emptive Green Phase" to clear a path.

Dynamic Density Scaling: Uses image recognition data to calculate the "Congestion Index" for each lane, allocating green-light time where it is needed most.

Predictive Sequencing: Analyzes historical traffic patterns to adjust signal behavior during peak hours before bottlenecks occur.

Cloud-Native Logic: Prototyped and refined using Google AI Studio for rapid deployment and high-fidelity decision-making.

Technical Stack
Engine: Python

AI Integration: Google AI Studio (Gemini 3 Flash)

Frontend: HTML/CSS (Live Monitoring Dashboard)

Deployment: Cloud Run (compatible)

System Logic
The system operates on a priority-weighted algorithm:

Poll Phase: Scan all 4 lanes for vehicle density and emergency signals.

Override Phase: If an Emergency Vehicle is detected, interrupt the current cycle and clear the relevant lane.

Optimization Phase: Distribute remaining green-light time proportionally based on the current Congestion Index.

Getting Started
View Prototype: [Link to your Google AI Studio Applet]

Run Locally:

Bash
git clone https://github.com/christojosephcodes/Smart-Junction.git
cd Smart-Junction
python main.py
Achievements
CHRISTOVATE 2026: Awarded First Place for innovative application of AI in civil infrastructure.

Developed by Christo Joseph (Lead), Awish Pinto, and Adwaith V Anandh.
