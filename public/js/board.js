document.addEventListener('DOMContentLoaded', () => {
  // 로그인 상태 확인
  const token = localStorage.getItem('token');
  if (!token) {
    alert('로그인을 하고 이용해주세요.');
    window.location.href = 'login.html';
    return;
  }

  let allBoards = [];
  let currentPage = 1;
  const PER_PAGE = 10;
  let currentSchoolFilter = 'all';
  let currentCategoryFilter = 'all';
  let editingBoardId = null;

  const boardListEl = document.getElementById('boardList');
  const paginationEl = document.getElementById('pagination');
  const btnWriteToggle = document.getElementById('btnWriteToggle');
  const overlay = document.getElementById('overlay');
  const writeForm = document.getElementById('writeForm');
  const formTitleEl = document.getElementById('formTitle');
  const writeTitleEl = document.getElementById('writeTitle');
  const writeSchoolEl = document.getElementById('writeSchool');
  const writeCategoryEl = document.getElementById('writeCategory');
  const writeContentEl = document.getElementById('writeContent');
  const writeImagesEl = document.getElementById('writeImages');
  const writeFilesEl = document.getElementById('writeFiles');
  const btnSubmitPost = document.getElementById('btnSubmitPost');
  const btnCancel = document.getElementById('btnCancel');

  // 필터 관련 DOM 요소 (이미 board.html에 포함됨)
  const toggleSchoolFilter = document.getElementById('toggleSchoolFilter');
  const schoolFilterOptions = document.getElementById('schoolFilterOptions');
  const closeSchoolFilter = document.getElementById('closeSchoolFilter');
  const toggleCategoryFilter = document.getElementById('toggleCategoryFilter');
  const categoryFilterOptions = document.getElementById('categoryFilterOptions');
  const closeCategoryFilter = document.getElementById('closeCategoryFilter');
  const schoolButtons = schoolFilterOptions.querySelectorAll('.filter-option');
  const categoryButtons = categoryFilterOptions.querySelectorAll('.filter-option');

  ClassicEditor
    .create(document.querySelector('#writeContent'))
    .then(editor => {
        // editor 인스턴스를 전역 변수에 저장하거나 필요 시 사용
        window.editor = editor;
    })
    .catch(error => {
        console.error('CKEditor 초기화 중 오류 발생:', error);
    });

  function openModal() {
    overlay.style.display = 'flex';
    writeForm.style.display = 'block';
  }
  function closeModal() {
    overlay.style.display = 'none';
    writeForm.style.display = 'none';
  }
  
  async function fetchBoards() {
    try {
      console.log(currentSchoolFilter);
      console.log(currentCategoryFilter);
      const response = await fetch(`/api/boards?school=${currentSchoolFilter}&category=${currentCategoryFilter}&page=${currentPage}&limit=${PER_PAGE}`);
      if (!response.ok) throw new Error('게시글 목록 불러오기 실패');
      const boards = await response.json();
      allBoards = boards;
      renderBoards();
      renderPagination();
    } catch (error) {
      console.error(error);
      boardListEl.innerHTML = `<div style="text-align:center;color:red;">게시글을 불러오는 중 오류가 발생했습니다.</div>`;
    }
  }


  categoryButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const selectedCategory = btn.getAttribute('data-category');
      currentCategoryFilter = selectedCategory; // 전역 변수 업데이트
      toggleCategoryFilter.innerHTML = '내용 분류:<br>' + btn.textContent + ' ▼';
      categoryFilterOptions.style.display = 'none';
      currentPage = 1;
      fetchBoards();
    });
  });
  schoolButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const selectedSchool = btn.getAttribute('data-school');
      currentSchoolFilter = selectedSchool; // 전역 변수 업데이트
      toggleSchoolFilter.innerHTML = '학교별 분류:<br>' + btn.textContent + ' ▼';
      schoolFilterOptions.style.display = 'none';
      currentPage = 1;
      fetchBoards();
    });
  });

  function renderBoards() {
    boardListEl.innerHTML = '';
    if (allBoards.length === 0) {
      boardListEl.innerHTML = `<div style="text-align:center;margin-top:50px;font-size:16px;color:#555;">표시할 게시글이 없습니다.</div>`;
      return;
    }
    allBoards.forEach(board => {
      // 제목이 공백 포함 15자 이상이면 자르기 (15자 초과일 경우)
      let titleText = board.title;
      const truncLength = window.innerWidth <= 600 ? 8 : 20;  // 모바일이면 10자, 그 외에는 15자
      if (titleText.length > truncLength) {
        titleText = titleText.substring(0, truncLength) + '...';
      }
      schoolText=board.school;
      if(schoolText=='세종과학예술영재학교') schoolText='세종영재';
      if(schoolText=='충남과학고등학교') schoolText='충남과고';
      if(schoolText=='충북과학고등학교') schoolText='충북과고';

      // 분류 정보: 학교와 내용 분류 (category가 없으면 "미분류"로 표시)
      const infoText = `${schoolText} / ${board.category || '미분류'}`;
  
      const item = document.createElement('div');
      item.className = 'board-item';
      item.innerHTML = `
        <div class="board-title">
          ${titleText}
          <span class="board-info-box">${infoText}</span>
        </div>
        <div class="board-meta">
            ${board.isAnonymous ? '익명' : board.author} | ${board.date} | 조회수: ${board.viewCount} | 추천: <span style="color: blue;">${board.recommendCount ? board.recommendCount : 0}</span>
        </div>
      `;
      item.addEventListener('click', (e) => {
        if (e.target.classList.contains('trash-icon') || e.target.classList.contains('edit-icon')) return;
        window.location.href = `boardDetail.html?id=${board.id}`;
      });
      const currentToken = localStorage.getItem('token');
      if (currentToken) {
        const editIcon = document.createElement('img');
        editIcon.src = 'edit.png';
        editIcon.alt = '수정';
        editIcon.className = 'edit-icon';
        editIcon.title = '게시글 수정';
        editIcon.addEventListener('click', (e) => {
          e.stopPropagation();
          openEditModal(board);
        });
        item.appendChild(editIcon);
  
        const trashIcon = document.createElement('img');
        trashIcon.src = 'trash.png';
        trashIcon.alt = '삭제';
        trashIcon.className = 'trash-icon';
        trashIcon.title = '게시글 삭제';
        trashIcon.addEventListener('click', (e) => {
          e.stopPropagation();
          if (confirm('정말 이 게시글을 삭제하시겠습니까?')) {
            deleteBoard(board.id);
          }
        });
        item.appendChild(trashIcon);
      }
      boardListEl.appendChild(item);
    });
  }
  

  function renderPagination() {
    paginationEl.innerHTML = '';
    for (let i = 1; i <= 10; i++) {
      const btn = document.createElement('button');
      btn.classList.add('page-btn');
      btn.textContent = i;
      btn.setAttribute('data-page', i);
      if (i === currentPage) btn.classList.add('active');
      btn.addEventListener('click', () => {
        currentPage = i;
        fetchBoards();
      });
      paginationEl.appendChild(btn);
    }
  }

  async function deleteBoard(boardId) {
    const currentToken = localStorage.getItem('token');
    if (!currentToken) {
      alert('로그인이 필요합니다.');
      return;
    }
    try {
      const response = await fetch(`/api/boards/${boardId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${currentToken}` }
      });
      if (response.status === 204) {
        alert('게시글이 삭제되었습니다.');
        fetchBoards();
      } else {
        const result = await response.json();
        alert(result.error || '게시글 삭제에 실패했습니다.');
      }
    } catch (error) {
      console.error(error);
      alert('게시글 삭제 중 오류가 발생했습니다.');
    }
  }

  function openEditModal(board) {
    editingBoardId = board.id;
    formTitleEl.textContent = '게시글 수정';
    writeTitleEl.value = board.title;
    writeSchoolEl.value = board.school;
    writeContentEl.value = board.content;
    writeCategoryEl.value = board.category || 'all';  // 추가된 부분
    openModal();
  }

  btnWriteToggle.addEventListener('click', () => {
    editingBoardId = null;
    formTitleEl.textContent = '새 게시글 작성';
    writeTitleEl.value = '';
    writeSchoolEl.value = '기타';
    writeContentEl.value = '';
    openModal();
  });

  btnSubmitPost.addEventListener('click', async (e) => {
    e.preventDefault();
    const currentToken = localStorage.getItem('token');
    if (!currentToken) {
      alert('로그인이 필요합니다.');
      return;
    }
    const titleVal = writeTitleEl.value.trim();
    const schoolVal = writeSchoolEl.value;
    const contentVal = window.editor.getData().trim();
    const imagesFiles = writeImagesEl.files;
    const filesFiles = writeFilesEl.files;
    const categoryVal = document.getElementById('writeCategory').value;
    if (!titleVal || !contentVal) {
      alert('제목과 내용을 모두 입력하세요!');
      return;
    }
    const formData = new FormData();
    const anonymousChecked = document.getElementById('anonymousCheckbox').checked;
    formData.append('isAnonymous', anonymousChecked ? 'true' : 'false');
    formData.append('title', titleVal);
    formData.append('school', schoolVal);
    formData.append('content', contentVal);
    formData.append('category', categoryVal);  // 추가된 부분
    for (let i = 0; i < imagesFiles.length; i++) {
      formData.append('images', imagesFiles[i]);
    }
    for (let i = 0; i < filesFiles.length; i++) {
      formData.append('files', filesFiles[i]);
    }
    try {
      let response;
      if (editingBoardId) {
        response = await fetch(`/api/boards/${editingBoardId}`, {
          method: 'PUT',
          headers: { 'Authorization': `Bearer ${currentToken}` },
          body: formData
        });
      } else {
        response = await fetch('/api/boards', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${currentToken}` },
          body: formData
        });
      }
      if (!response.ok) throw new Error('게시글 등록/수정 실패');
      await response.json();
      alert('게시글이 성공적으로 처리되었습니다.');
      closeModal();
      fetchBoards();
    } catch (error) {
      console.error(error);
      alert('게시글 작성/수정 중 오류가 발생했습니다.');
    }
  });

  btnCancel.addEventListener('click', (e) => {
    e.preventDefault();
    closeModal();
  });

  // 초기 게시글 로드
  fetchBoards();
  window.fetchBoards = fetchBoards;
});
