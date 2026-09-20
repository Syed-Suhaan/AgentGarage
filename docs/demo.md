# Demo

Agent: autonomous AWS SRE agent. It gets a goal and five tools. No fixed script,
so every run can branch differently.

1. Run clean checkout remediations. The dashboard draws the paths the agent actually took.
2. The dashboard highlights one path the agent never took: rollback succeeding, then
   the tool response timing out.
3. The world model predicts the agent will retry and roll back one version too far.
4. The sandbox creates that exact timeout and runs the real agent in it.
   Invariants show `rollback_count = 2` and `active_version != last_known_good`.
   Path marked verified.
5. An eval file is saved. Status protected.
6. Add an operation token and a post-timeout state recheck. Re-run the eval file. Pass.

The video needs one failed run and one passing re-run. Nothing else.
