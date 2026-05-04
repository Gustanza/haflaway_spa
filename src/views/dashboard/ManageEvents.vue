<template>
  <div class="empty-screen">
    <div class="icon-wrap">
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#C9A84C" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="3"/>
        <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/>
        <line x1="3" y1="10" x2="21" y2="10"/>
      </svg>
    </div>
    <h1 class="title">Manage Events</h1>
    <p class="sub">This section is under construction.</p>
  </div>
</template>

<style scoped>
.empty-screen {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  min-height: 100vh;
  gap: 14px;
  font-family: 'Inter', -apple-system, sans-serif;
}

.icon-wrap {
  width: 64px;
  height: 64px;
  border-radius: 18px;
  background: #2A2210;
  border: 0.8px solid rgba(201, 168, 76, 0.25);
  display: flex;
  align-items: center;
  justify-content: center;
}

.title {
  font-size: 22px;
  font-weight: 700;
  color: #EEEEF0;
  letter-spacing: -0.5px;
  margin: 0;
}

.sub {
  font-size: 14px;
  color: #8E8E93;
  margin: 0;
}
</style>
