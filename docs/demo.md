# Demo

Agent: autonomous refund agent. It gets a goal and four tools. No fixed script,
so every run can branch differently.

1. Run clean tasks. The dashboard draws the paths the agent actually took.
2. The dashboard highlights one path the agent never took: the refund tool
   timing out after the refund already went through.
3. The world model predicts the agent will retry and refund twice.
4. The sandbox creates that exact timeout and runs the real agent in it.
   The ledger shows 2 refunds. Path marked verified.
5. An eval file is saved. Status protected.
6. Add an idempotency key to the agent. Re-run the eval file. Pass.

The video needs one failed run and one passing re-run. Nothing else.
