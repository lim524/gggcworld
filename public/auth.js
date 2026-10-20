'use strict';
const account = { user: null, enabled: false, loading: true, busy: false };
async function accountRequest(path, method = 'GET', body) {
  const response = await fetch(path, { method, credentials: 'same-origin', cache: 'no-store', headers: { 'Content-Type': 'application/json' }, ...(body ? { body: JSON.stringify(body) } : {}) });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || data.message || '요청을 완료하지 못했어요.');
  return data;
}
function syncAccount(user) {
  account.user = user;
  if (user) {
    profile = user.profile || { name: '여행자', faction: null };
    persist('gggc-profile-v1', profile);
  } else {
    profile = { name: '여행자', faction: null };
    persist('gggc-profile-v1', profile);
  }
  renderProfile();
  const button = document.querySelector('.top-login');
  button.textContent = user ? '내 계정 ' : '로그인 ';
  document.querySelector('.full-button').textContent = user?.profile ? '나의 진영 확인하기 ' : '나의 진영 선택하기 ';
  document.querySelector('.full-button').nextElementSibling.textContent = user ? '프로필과 확정한 진영은 계정에 저장됩니다.' : '게스트의 진영 선택은 이 기기에만 저장됩니다.';
  window.dispatchEvent(new Event('gggc:factionchange'));
  window.dispatchEvent(new Event('gggc:accountchange'));
}
function showAccount() {
  if (account.loading) { toast('로그인 상태를 확인하고 있어요.'); return; }
  if (!account.user) {
    open(`<div class="modal-body account-panel"><span class="micro">WELCOME TO GGGC</span><h2 id="modal-title">나의 신과 함께, 광장으로</h2><p class="subtitle">Google 계정으로 시작하고 닉네임과 진영을 선택하세요.</p><button class="google-login secondary" data-google-login ${account.enabled ? '' : 'disabled'}>Google로 계속하기</button><p class="subtitle">${account.enabled ? '처음 로그인하면 계정이 만들어집니다. Google 이름 대신 별도의 닉네임을 사용해요.' : '로그인 연결을 준비하고 있어요. 연결이 완료되면 여기서 시작할 수 있어요.'}</p><p class="subtitle">로그인하고 진영을 확정하면 광장에 글과 댓글을 남길 수 있어요.</p><p id="account-error" role="alert"></p></div>`);
    return;
  }
  const member = account.user.profile;
  open(`<div class="modal-body account-panel"><span class="micro">${member ? 'MY ACCOUNT' : 'YOUR FIRST JOURNEY'}</span><h2 id="modal-title">${member ? '내 계정' : '당신의 여행을 시작하세요'}</h2><form id="account-form"><label for="account-name">닉네임</label><input id="account-name" autocomplete="nickname" minlength="2" maxlength="20" required value="${esc(member?.name || '')}" placeholder="광장에서 사용할 이름"><label for="account-faction">나의 진영</label><select id="account-faction" required ${member ? 'disabled' : ''}><option value="">함께할 신을 골라주세요</option>${F.map(f => `<option value="${f.id}" ${member?.faction === f.id ? 'selected' : ''}>${f.name} · ${f.ai}</option>`).join('')}</select><p class="subtitle">진영은 가입할 때 확정되며 이후 변경할 수 없어요.</p>${member ? '' : '<label class="account-confirm"><input type="checkbox" required> 선택한 진영을 확정하는 데 동의해요.</label>'}<p id="account-error" role="alert"></p><div class="modal-footer"><button type="button" class="secondary" data-logout>로그아웃</button><button type="submit" class="write">${member ? '닉네임 저장' : '이 진영으로 시작하기'}</button></div></form></div>`);
}
async function accountAction(task) {
  if (account.busy) return;
  account.busy = true;
  document.querySelectorAll('.account-panel button').forEach(b => b.disabled = true);
  try { await task(); } catch (error) {
    const target = document.querySelector('#account-error');
    if (target) target.textContent = error.message; else toast(error.message);
  } finally { account.busy = false; document.querySelectorAll('.account-panel button').forEach(b => b.disabled = false); }
}
// Capture account interactions before the prototype's local profile handlers.
document.addEventListener('click', event => {
  const button = event.target.closest('button'); if (!button) return;
  const d = button.dataset;
  if (d.open === 'profile' || (account.user && (d.open === 'factions' || 'pick' in d))) {
    event.preventDefault(); event.stopImmediatePropagation(); showAccount();
  }
  if ('googleLogin' in d && account.enabled) {
    event.preventDefault(); event.stopImmediatePropagation();
    accountAction(async () => {
      const success = new URL(location.href), failure = new URL(location.href);
      success.searchParams.set('login', 'success'); failure.searchParams.set('login', 'error');
      const data = await accountRequest('/api/auth/sign-in/social', 'POST', { provider: 'google', callbackURL: success.href, errorCallbackURL: failure.href });
      const destination = new URL(data.url);
      if (destination.protocol !== 'https:' || destination.hostname !== 'accounts.google.com') throw new Error('로그인 주소를 확인하지 못했어요.');
      location.assign(destination.href);
    });
  }
  if ('logout' in d) {
    event.preventDefault(); event.stopImmediatePropagation();
    accountAction(async () => {
      await accountRequest('/api/auth/sign-out', 'POST', {});
      profile = { name: '여행자', faction: null }; persist('gggc-profile-v1', profile);
      syncAccount(null); close(); toast('로그아웃했어요.');
    });
  }
}, true);
document.addEventListener('submit', event => {
  if (event.target.id !== 'account-form') return;
  event.preventDefault();
  const name = document.querySelector('#account-name').value.trim(), selected = document.querySelector('#account-faction').value;
  accountAction(async () => {
    const data = await accountRequest('/api/me', 'PATCH', { name, faction: selected });
    syncAccount(data.user); close(); toast('계정에 프로필을 저장했어요.');
  });
});
async function refreshAccount() {
  try {
    const config = await accountRequest('/api/config'); account.enabled = config.loginEnabled;
    if (account.enabled) { const data = await accountRequest('/api/me'); syncAccount(data.user); }
  } catch { account.enabled = false; }
  finally { account.loading = false; document.querySelector('.top-login').textContent = account.user ? '내 계정 ' : '로그인 '; }
  const params = new URLSearchParams(location.search);
  if (params.has('login')) {
    if (params.get('login') === 'error') toast('로그인이 취소되었거나 완료되지 않았어요. 다시 시도해주세요.');
    params.delete('login'); history.replaceState(null, '', location.pathname + (params.size ? '?' + params : '') + location.hash);
  }
  if (account.user?.needsOnboarding) showAccount();
}
window.addEventListener('pageshow', () => { if (!account.loading) refreshAccount(); });
document.addEventListener('visibilitychange', () => { if (!document.hidden && !account.loading) refreshAccount(); });
const accountReady = refreshAccount();
