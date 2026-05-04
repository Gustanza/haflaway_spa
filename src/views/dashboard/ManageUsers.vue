<template>
  <div class="empty-screen">
    <div class="icon-wrap">
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#C9A84C" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="9" cy="7" r="4"/><path d="M3 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2"/>
        <path d="M16 3.13a4 4 0 0 1 0 7.75"/><path d="M21 21v-2a4 4 0 0 0-3-3.87"/>
      </svg>
    </div>
    <h1 class="title">Manage Users</h1>
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
