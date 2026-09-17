# AgentGarage

Autonomous agents pick tools in a loop and branch on what they observe. They run with broad permissions and weak guardrails. Testing covers a fraction of the paths they can reach.

AgentGarage maps which behaviours an agent has actually exercised, finds reachable paths it never took, predicts what happens on those paths with a world model, replays the promising ones against the real agent in isolation, and keeps every confirmed failure as a permanent eval.

One rule governs the whole system: a predicted failure is a hypothesis until the real agent reproduces it. No path is marked failed on a model's word.

The demo agent is autonomous. It gets a goal and four tools, no fixed script. Its branching is real, so the map it produces is real.
