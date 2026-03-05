# Ant Colony Optimization (ACO) Virus Simulation

An interactive visual simulation that models how decentralized agents (ants) combat malware infections spreading through a computer network, using the principles of Ant Colony Optimization (ACO). 

This project demonstrates the power of swarm intelligence in cybersecurity, showcasing how independent agents can collaborate using pheromone-based threat intelligence to detect, isolate, and neutralize network anomalies.

## 🚀 Features

### Simulation Environment
- **Dynamic Network Graph:** A procedurally generated network of interconnected nodes and edges representing computers and their connections.
- **Malware Propagation:** Simulates the spread of viruses (infection waves) between interconnected nodes based on a configurable infection rate.
- **Swarm Intelligence Agents:** Deploys security "ants" that wander the network, identifying degraded or infected nodes and restoring them to a healthy state.
- **Pheromone Threat Intelligence:** Agents leave digital "pheromones" when they detect threats, guiding other agents toward highly suspicious areas of the network.

### Real-Time Analytics Dashboard
- **Live Metrics:** Monitor Active Infections, Infection Coverage, Detection Efficiency, and Total Pheromone Mass in real-time.
- **Cycle Analytics:** Track granular metrics over specific periods, including Net Resolved Events, Cycle Containment Rate, and overall Algorithm Efficiency.

### Interactive Controls
Tune the algorithm and environment in real-time to see how the swarm adapts:
- **ACO Parameters:** Adjust Pheromone Weight ($\alpha$), Heuristic Weight ($\beta$), and Pheromone Evaporation Rate ($\rho$).
- **Environment Parameters:** Modify the Malware Emission Rate, the Number of Security Agents, and Simulation Speed.
- **Visualization Layers:** Toggle the visibility of Pheromone paths and individual Agent markers.

### AI Assistant (Gemini)
Includes an integrated chatbot powered by the Google Gemini API (`@google/genai`). Users can ask the bot questions regarding the simulation mechanics, the ACO algorithm, or how to interpret the dashboard metrics.

For a list of common questions you can ask the assistant, check out the [Chatbot Simulation Questions Guide](CHATBOT_QUESTIONS.md).

## 🛠️ Technology Stack
- **Frontend:** React, TypeScript, Vite
- **Styling:** Tailwind CSS, shadcn/ui components
- **AI Integration:** `@google/genai` (Gemini 2.5 Flash)
- **Icons:** Lucide React

## 📦 Installation & Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/alilakkadghat/ACO.git
   cd ACO/Text-File-App
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   Create a `.env` file inside the `client/` directory and add your Gemini API key:
   ```env
   VITE_GEMINI_API_KEY=your_gemini_api_key_here
   ```

4. **Start the Development Server:**
   ```bash
   npm run dev
   ```
   The application will be available at `http://localhost:3001` (or your configured Vite port).

## 💡 How it Works (ACO Mechanics)
1. **Exploration:** Security agents traverse the network edges.
2. **Detection:** When an agent encounters a "suspicious" or "infected" node, its heuristic value ($\beta$) spikes.
3. **Reinforcement:** The agent deposits pheromones along the path leading to the threat.
4. **Exploitation:** Other wandering agents sense the pheromone trail ($\alpha$). They are statistically drawn toward paths with higher pheromone concentrations, creating a swarm effect targeting the active infection.
5. **Evaporation:** Over time, pheromones evaporate ($\rho$). If a threat is neutralized and agents stop reinforcing the trail, the swarm naturally disperses to explore other areas of the network, preventing over-fixation on obsolete threats.

## 🤖 Chatbot Examples
Not sure what a metric means? Click the chat icon in the bottom right and ask:
- *"How is algorithm efficiency calculated?"*
- *"What happens if I set the evaporation rate to 1.0?"*
- *"Why are some paths glowing red?"*

## 📜 License
This project is open-source and available under the standard MIT License.
