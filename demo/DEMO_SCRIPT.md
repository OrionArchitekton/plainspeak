# Plainspeak — demo script
# Fresh context per shot. ?demo=fill prefills the lease; ?demo=lease&focus=<card>
# renders ONE result card full-screen so captions never cover it.

### SHOT intro
- target: dashboard
- narration: Every day, people agree to documents they don't actually understand. Plainspeak fixes that.
- action: goto url="/"
- action: wait ms=1500

### SHOT paste
- target: dashboard
- narration: Paste anything dense. Here is a real apartment lease.
- action: goto url="/?demo=fill"
- action: wait ms=700
- action: highlight selector="textarea"
- action: wait ms=1400

### SHOT run
- target: dashboard
- narration: Tell it who you are, and let Claude read the fine print.
- action: goto url="/?demo=fill"
- action: wait ms=500
- action: highlight selector="#explain-btn"
- action: wait ms=300
- action: click selector="#explain-btn"
- action: wait ms=2000

### SHOT plain
- target: dashboard
- narration: First, what it actually says, in plain words.
- action: goto url="/?demo=lease&focus=plain"
- action: wait ms=900
- action: highlight selector="#card-plain"
- action: wait ms=2000

### SHOT affects
- target: dashboard
- narration: Then the parts that affect you, ranked by severity.
- action: goto url="/?demo=lease&focus=affects"
- action: wait ms=900
- action: highlight selector="#card-affects"
- action: wait ms=2400

### SHOT questions
- target: dashboard
- narration: And the exact questions to ask before you sign.
- action: goto url="/?demo=lease&focus=questions"
- action: wait ms=900
- action: highlight selector="#card-questions"
- action: wait ms=2200

### SHOT outro
- target: dashboard
- narration: Plainspeak. Built end to end by Claude Code for the FutureAI Global Hackathon 2026.
- action: goto url="/?demo=lease"
- action: wait ms=2000
