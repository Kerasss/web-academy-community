// public/js/header.js

// 관리자 계정 ID 배열
const adminIds = [1, 10]; // 원하는 관리자 ID로 수정하세요.

async function updateHeader() {
    const token = localStorage.getItem('token');
    if (token) {
        try {
            const response = await fetch('/api/user', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            const result = await response.json();
            if (response.ok && result.user) {
                // '로그인'을 '로그아웃'으로 변경
                const authLink = document.getElementById('auth-link');
                if (authLink) {
                    authLink.innerHTML = '<a href="#" onclick="handleLogout()">로그아웃</a>';
                }

                // 사용자 정보 표시
                const userInfo = document.getElementById('user-info');
                if (userInfo) {
                    userInfo.innerHTML = `
                        <div class="user-info-box" id="user-info-box">
                            <span>${result.user.studentName} (${result.user.schoolName || '학교명 없음'}, ${result.user.grade || '학년 없음'})</span>
                        </div>
                    `;
                    // 사용자 정보 박스 클릭 시 팝업 열기
                    const userInfoBox = document.getElementById('user-info-box');
                    if (userInfoBox) {
                        userInfoBox.addEventListener('click', () => {
                            openUserEditModal(result.user);
                        });
                    }
                }

                // 관리자 여부 확인 및 전역 변수 설정
                window.isAdmin = adminIds.includes(result.user.id);
                console.log('isAdmin:', window.isAdmin); // 디버깅용 로그

                // 커스텀 이벤트 발송: 헤더 업데이트 완료
                document.dispatchEvent(new Event('headerUpdated'));
            } else {
                // 유효하지 않은 토큰일 경우 토큰 제거 및 헤더 초기화
                localStorage.removeItem('token');
                resetHeader();
                window.isAdmin = false;

                // 커스텀 이벤트 발송: 헤더 업데이트 완료
                document.dispatchEvent(new Event('headerUpdated'));
            }
        } catch (error) {
            console.error('사용자 정보 가져오기 오류:', error);
            localStorage.removeItem('token');
            resetHeader();
            window.isAdmin = false;

            // 커스텀 이벤트 발송: 헤더 업데이트 완료
            document.dispatchEvent(new Event('headerUpdated'));
        }
    } else {
        resetHeader();
        window.isAdmin = false;

        // 커스텀 이벤트 발송: 헤더 업데이트 완료
        document.dispatchEvent(new Event('headerUpdated'));
    }
    const hamburgerMenu = document.getElementById('hamburgerMenu');
    const navList = document.querySelector('nav ul');
    const headerContainer = document.querySelector('.header-container');
    
    if (hamburgerMenu && navList && headerContainer) {
        hamburgerMenu.addEventListener('click', () => {
            navList.classList.toggle('active');
        });
    }
}

function resetHeader() {
    const authLink = document.getElementById('auth-link');
    if (authLink) {
        // 현재 경로가 login.html인 경우 active 클래스를 추가
        const isLoginPage = window.location.pathname.endsWith('login.html');
        authLink.innerHTML = `<a href="login.html" ${isLoginPage ? 'style="color:yellow"' : ''}>로그인</a>`;
    }

    const userInfo = document.getElementById('user-info');
    if (userInfo) {
        userInfo.innerHTML = '';
    }
}

function handleLogout() {
    if (confirm('로그아웃 하시겠습니까?')) {
        localStorage.removeItem('token');
        resetHeader();
        window.isAdmin = false;
        location.reload();
    }
}

// 로그인 여부 확인 함수
function isLoggedIn() {
    const token = localStorage.getItem('token');
    return !!token;
}

// 페이지 로드 시 헤더 업데이트
document.addEventListener('DOMContentLoaded', updateHeader);

// 사용자 정보 수정 팝업 열기 함수
function openUserEditModal(user) {
    // 사용자 정보 수정 폼을 채움
    const editUserId = document.getElementById('edit-userid');
    const editStudentName = document.getElementById('edit-studentName');
    const editSchoolName = document.getElementById('edit-schoolName');
    const editGrade = document.getElementById('edit-grade');
    const editParentPhone = document.getElementById('edit-parentPhone');
    const editStudentPhone = document.getElementById('edit-studentPhone');
    const editEmail = document.getElementById('edit-email');

    if (editUserId && editStudentName && editParentPhone && editStudentPhone) {
        editUserId.value = user.userid;
        editStudentName.value = user.studentName;
        if (editSchoolName) editSchoolName.value = user.schoolName || '';
        if (editGrade) editGrade.value = user.grade || '';
        editParentPhone.value = user.parentPhone;
        editStudentPhone.value = user.studentPhone;
        if (editEmail) editEmail.value = user.email || '';
    }

    // 모달 표시
    const modal = document.getElementById('user-edit-modal');
    const overlay = document.getElementById('modal-overlay');
    if (modal && overlay) {
        modal.style.display = 'block';
        overlay.style.display = 'block';
    }

    // 모달 닫기 이벤트 리스너 추가 (이미 존재하는 경우 중복 추가 방지)
    const closeModalButton = document.getElementById('close-modal');
    if (closeModalButton && !closeModalButton.dataset.listenerAdded) {
        closeModalButton.addEventListener('click', () => {
            closeUserEditModal();
        });
        closeModalButton.dataset.listenerAdded = 'true';
    }

    const overlayElement = document.getElementById('modal-overlay');
    if (overlayElement && !overlayElement.dataset.listenerAdded) {
        overlayElement.addEventListener('click', () => {
            closeUserEditModal();
        });
        overlayElement.dataset.listenerAdded = 'true';
    }
}

// 모달 닫기 기능
function closeUserEditModal() {
    const modal = document.getElementById('user-edit-modal');
    const overlay = document.getElementById('modal-overlay');
    if (modal) modal.style.display = 'none';
    if (overlay) overlay.style.display = 'none';
}

// 키보드 이벤트로 모달 닫기 (Esc 키)
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closeUserEditModal();
    }
});

// 사용자 정보 수정 폼 제출 처리
const editUserForm = document.getElementById('edit-user-form');
if (editUserForm) {
    editUserForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const token = localStorage.getItem('token');
        if (!token) {
            alert('로그인이 필요합니다.');
            closeUserEditModal();
            return;
        }

        const userid = document.getElementById('edit-userid')?.value.trim();
        const studentName = document.getElementById('edit-studentName')?.value.trim();
        const schoolName = document.getElementById('edit-schoolName')?.value.trim();
        const grade = document.getElementById('edit-grade')?.value.trim();
        const parentPhone = document.getElementById('edit-parentPhone')?.value.trim();
        const studentPhone = document.getElementById('edit-studentPhone')?.value.trim();
        const email = document.getElementById('edit-email')?.value.trim();

        // 필수 필드 확인
        if (!studentName || !parentPhone || !studentPhone) {
            alert('학생 이름, 보호자 연락처, 학생 연락처는 필수 항목입니다.');
            return;
        }

        try {
            const response = await fetch('/api/user', {
                method: 'PUT', // 업데이트는 PUT 메소드 사용
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    studentName,
                    schoolName,
                    grade,
                    parentPhone,
                    studentPhone,
                    email
                })
            });

            const result = await response.json();
            if (response.ok) {
                alert(result.message || '사용자 정보가 성공적으로 수정되었습니다.');
                // 사용자 정보 박스 업데이트
                const userInfoBox = document.getElementById('user-info-box');
                if (userInfoBox) {
                    userInfoBox.innerHTML = `
                        <span>${studentName} (${schoolName || '학교명 없음'}, ${grade || '학년 없음'})</span>
                    `;
                }
                closeUserEditModal();
            } else {
                alert(result.error || '사용자 정보 수정에 실패했습니다.');
            }
        } catch (err) {
            console.error('사용자 정보 수정 오류:', err);
            alert('서버와 통신 중 오류가 발생했습니다.');
        }
    });
}
