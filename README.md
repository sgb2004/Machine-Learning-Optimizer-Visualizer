# 3D Machine Learning Optimizer Visualizer

An interactive web application designed to visualize how various mathematical optimization algorithms navigate 3D loss landscapes. This tool is perfect for building an intuitive understanding of how algorithms like Adam and Gradient Descent find the minimum of complex mathematical functions.

## ✨ Features

* **Interactive 3D Surfaces:** Visualize mathematical functions as 3D terrains with dynamic, elevation-based color mapping.
* **Real-time Path Tracking:** Watch a rolling ball trace the exact path taken by the optimizer, leaving a visible 3D tube trail behind it.
* **Multiple Environments:** Choose from preset surfaces (Hill, Valley, Twin Hills, Terrain) or write and render your own custom mathematical expressions.
* **Live Formula Display:** View the mathematical formula of the active surface rendered dynamically using LaTeX.
* **Simulation Controls:** A comprehensive control panel allows you to adjust starting coordinates, tweak learning rates, and track run history, steps, and loss.

## 🧠 Supported Optimizers

The visualizer includes implementations of standard Machine Learning and mathematical optimizers:
* **Gradient Descent**
* **Momentum**
* **RMSProp**
* **Adam**
* **Newton's Method**

## 🛠️ Tech Stack

* **Framework:** Next.js (App Router)
* **3D Graphics:** Three.js via React Three Fiber (`@react-three/fiber` and `@react-three/drei`)
* **Styling:** Tailwind CSS with a custom dark-mode focused theme
* **UI Components:** Built using Radix UI primitives for accessibility

## 🚀 Getting Started

First, clone the repository and install the dependencies:

\`\`\`bash
npm install
# or
yarn install
# or
pnpm install
\`\`\`

Then, run the development server:

\`\`\`bash
npm run dev
# or
yarn dev
# or
pnpm dev
\`\`\`

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result. You can pan the 3D camera using your mouse or the WASD/Arrow keys.
