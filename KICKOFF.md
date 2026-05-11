### SERVICE CONFIG – CHANGE ONLY THIS BLOCK
service:
  name:        Apollo.io
  domain:      apollo.io
  npm:         apollo-agent-cli
  npmFallback: apollo-crm-cli
  github:      bcharleson/apollo-agent-cli

# ────────────────────────────────────────────────────────────────

What I'd like you to do is first carefully analyze every single CLI tool I have created inside the `~/Developer` folder.

These tools serve as dual-purpose CLI applications and MCP servers. Their main goal is to take existing SaaS platforms and make them fully agent-native by wrapping their complete APIs into rich skills/tools, writing detailed AGENTS.md files, and building fully-featured CLI tools with comprehensive flags and commands.

I have built quite a few of these already. Study all of them thoroughly — note both the common patterns and the differences — so you understand my established architecture and conventions.

I now want you to build one for {service.name} ({service.domain}).

One of my clients uses {service.name} extensively and wants to stand up agents that can leverage its full capabilities. Our goal is to wrap the {service.name} API as completely as possible for agent use.

After analyzing my existing tools, please:

1. Thoroughly research and map out the official {service.name} API (authentication, all endpoints, capabilities, rate limits, webhooks, GraphQL/REST details, etc.).

2. Check npm to see if the package name "{service.npm}" is available. If taken, use the fallback "{service.npmFallback}".

3. Enter "plan mode":
   - Summarize what you've learned from studying my existing tools
   - Detail your findings about the {service.name} API
   - Present a detailed implementation plan covering architecture, key CLI commands/flags, agent skills to expose, AGENTS.md structure, and any special considerations for this service
   - List anything else you need from me

Once I approve the plan, we will proceed to full implementation.

The project will live at github.com/{service.github}.

Confirm that you understand the task and let's do it.
