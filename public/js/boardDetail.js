document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const boardId = urlParams.get('id');
    if (!boardId) {
      alert('게시글 ID가 없습니다.');
      history.back();
      return;
    }
    
    function computeEmbedUrl(url) {
      let embedUrl = url;
      if (url.includes('watch?v=')) {
        embedUrl = url.replace('watch?v=', 'embed/');
      } else if (url.includes('youtu.be/')) {
        embedUrl = url.replace('youtu.be/', 'www.youtube.com/embed/');
      }
      return embedUrl;
    }

    // DOM 요소들
    const boardTitle = document.getElementById('boardTitle');
    const boardAuthor = document.getElementById('boardAuthor');
    const boardDate = document.getElementById('boardDate');
    const boardViews = document.getElementById('boardViews');
    const boardContent = document.getElementById('boardContent');
    const imageContainer = document.getElementById('imageContainer');
    const contentText = document.getElementById('contentText');
    const attachmentsBox = document.getElementById('attachmentsBox');
    const attachmentList = document.getElementById('attachmentList');
    const commentsList = document.getElementById('commentsList');
    const newCommentTextarea = document.getElementById('newComment');
    const submitCommentButton = document.getElementById('submitComment');
    const backButton = document.getElementById('backButton');
    const commentPhotoInput = document.getElementById('commentPhotoInput');
    const commentFilesInput = document.getElementById('commentFilesInput');
    const commentAttachmentFilenames = document.getElementById('commentAttachmentFilenames');
    const recommendIcon = document.getElementById('recommendIcon');
    const recommendCountElem = document.getElementById('recommendCount');

    // 아이콘 클릭 이벤트 처리 (파일 선택창 열기)
    document.getElementById('commentPhotoIcon').addEventListener('click', () => {
      commentPhotoInput.click();
    });
    document.getElementById('commentFilesIcon').addEventListener('click', () => {
      commentFilesInput.click();
    });

    
    function loadBoard() {
      fetch(`/api/boards/${boardId}`)
        .then(res => {
          if (!res.ok) throw new Error('게시글을 불러오는 중 오류가 발생했습니다.');
          return res.json();
        })
        .then(data => {
          const board = data.board || data;
          boardAuthor.textContent = board.isAnonymous ? '익명' : board.author;
          boardDate.textContent = board.date || '날짜 없음';
          boardViews.textContent = board.viewCount ? board.viewCount.toString() : '0';
          document.getElementById('boardRecommends').textContent = board.recommendCount ? board.recommendCount.toString() : '0';
          if (board.content) {
            contentText.innerHTML = board.content;
            // oembed 태그 변환 코드 추가 (boardContent 내부에서 검색)
            const mediaFigures = contentText.querySelectorAll('figure.media');
            mediaFigures.forEach(figure => {
              Array.from(figure.children).forEach(child => {
                if (child.tagName.toLowerCase() === 'oembed') {
                  const url = child.getAttribute('url');
                  if (!url) return;
                  let embedUrl = url;
                  if (url.includes('watch?v=')) {
                    embedUrl = url.replace('watch?v=', 'embed/');
                  } else if (url.includes('youtu.be/')) {
                    embedUrl = url.replace('youtu.be/', 'www.youtube.com/embed/');
                  }
                  
                  // 새 div 요소 생성 및 가운데 정렬 스타일 추가
                  const containerDiv = document.createElement('div');
                  containerDiv.setAttribute('data-oembed-url', url);
                  containerDiv.style.textAlign = 'center';  // 내부 요소 가운데 정렬
                  
                  // iframe 생성 및 가운데 정렬
                  const iframe = document.createElement('iframe');
                  iframe.src = embedUrl;
                  iframe.width = '560';
                  iframe.height = '315';
                  iframe.frameBorder = '0';
                  iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
                  iframe.allowFullscreen = true;
                  iframe.style.display = 'block';         // block 요소로 만들어야 margin auto 적용됨
                  iframe.style.margin = '0 auto';           // 좌우 자동 여백으로 가운데 정렬
                  
                  containerDiv.appendChild(iframe);
                  figure.replaceChild(containerDiv, child);
                }
              });
            });
          } else {
            contentText.innerHTML = '내용이 없습니다.';
          }
//  contentText.innerHTML = board.content || '내용이 없습니다.';
// contentText.textContent = board.content || '내용이 없습니다.';
          if (recommendCountElem) {
            recommendCountElem.textContent = board.recommendCount || 0;
          }
          const titleElem = document.querySelector('#boardTitle .title-text');
          if (titleElem) {
            titleElem.textContent = board.title || '제목 없음';
          }
          schoolText=board.school;
          if(schoolText=='세종과학예술영재학교') schoolText='세종영재';
          if(schoolText=='충남과학고등학교') schoolText='충남과고';
          if(schoolText=='충북과학고등학교') schoolText='충북과고';
          // info box 업데이트 (추가)
          const boardInfoBox = document.getElementById('boardInfoBox');
          if (boardInfoBox) {
            // 예: "학교 / 분류" 형식으로 표시 (필요시 포맷 수정)
            boardInfoBox.textContent = `${schoolText || ''} / ${board.category || ''}`;
          }
    
          // 이미지 처리 (기존 코드 그대로)
          if (board.images) {
            try {
              const images = JSON.parse(board.images);
              imageContainer.innerHTML = '';
              if (Array.isArray(images) && images.length > 0) {
                images.forEach(imgPath => {
                  const img = document.createElement('img');
                  img.src = imgPath;
                  imageContainer.appendChild(img);
                });
              }
            } catch (e) {
              console.error('이미지 파싱 오류:', e);
              imageContainer.innerHTML = '';
            }
          } else {
            imageContainer.innerHTML = '';
          }
    
          // 첨부파일 처리 (기존 코드 그대로)
          if (board.attachments) {
            try {
              const files = JSON.parse(board.attachments);
              if (Array.isArray(files) && files.length > 0) {
                attachmentsBox.style.display = 'block';
                attachmentList.innerHTML = '';
                files.forEach((filePath, idx) => {
                  const fileName = filePath.split('/').pop() || `첨부파일${idx+1}`;
                  const link = document.createElement('a');
                  link.href = filePath;
                  link.textContent = fileName;
                  link.download = '';
                  link.className = 'attachment-item';
                  attachmentList.appendChild(link);
                });
              } else {
                attachmentsBox.style.display = 'none';
              }
            } catch (e) {
              console.error('첨부파일 파싱 오류:', e);
              attachmentsBox.style.display = 'none';
            }
          } else {
            attachmentsBox.style.display = 'none';
          }
        })
        .catch(err => {
          console.error(err);
          alert(err.message);
        });
        
    }
    if (recommendIcon) {
      recommendIcon.addEventListener('click', async () => {
        const token = localStorage.getItem('token');
        if (!token) {
          alert('로그인이 필요합니다.');
          return;
        }
        try {
          const response = await fetch(`/api/boards/${boardId}/recommend`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          const result = await response.json();
          if (!response.ok) {
            alert(result.error);
          } else {
            // 업데이트된 추천 수 반영
            recommendCountElem.textContent = result.recommendCount;
          }
        } catch (error) {
          console.error(error);
          alert('추천 처리 중 오류가 발생했습니다.');
        }
      });
    }
  
    // 댓글 불러오기
    function loadComments() {
      fetch(`/api/boards/${boardId}/comments`)
        .then(res => {
          if (!res.ok) throw new Error('댓글을 불러오는 중 오류가 발생했습니다.');
          return res.json();
        })
        .then(data => {
          const comments = data.comments ? data.comments : data;
          renderComments(comments);
        })
        .catch(err => {
          console.error(err);
          commentsList.innerHTML = `<p style="color:red;">댓글을 불러오는 중 오류가 발생했습니다.</p>`;
        });
    }
  
        // 댓글 및 답글 렌더링 – 댓글 클릭 시 답글 입력창 토글 (내부 클릭은 닫히지 않음)
        function renderComments(comments) {
          commentsList.innerHTML = '';
          comments.forEach(comment => {
            const commentDiv = document.createElement('div');
            commentDiv.className = 'comment';
            
            // 1. 댓글 헤더 생성 (작성자, 작성일)
            const headerElem = document.createElement('div');
            headerElem.className = 'comment-header';
            headerElem.innerHTML = `
              <span class="comment-author">${comment.author}</span> | 
              <span class="comment-date">${comment.date}</span>
            `;
            commentDiv.appendChild(headerElem);
            
            // 2. 첨부 사진 (있는 경우) -> 헤더 아래에 추가
            if (comment.photo && window.innerWidth<=600) {
              const photoElem = document.createElement('img');
              photoElem.src = comment.photo;
              photoElem.style.display = 'block';
              photoElem.style.margin = '10px auto 10px'; // 위아래 여백 10px
              photoElem.style.maxWidth = '100%';
              commentDiv.appendChild(photoElem);
            }

            if (comment.photo && window.innerWidth>600) {
              const photoElem = document.createElement('img');
              photoElem.src = comment.photo;
              photoElem.style.display = 'block';
              photoElem.style.margin = '10px auto 10px';
              // 이미지가 너무 크면 최대 600px x 300px 이하로 축소되도록 설정합니다.
              photoElem.style.maxWidth = '600px';
              photoElem.style.maxHeight = '350px';
              photoElem.style.width = 'auto';
              photoElem.style.height = 'auto';
              commentDiv.appendChild(photoElem);
            }
            
            
            // 3. 댓글 본문 추가 (사진 아래에)
            const contentElem = document.createElement('div');
            contentElem.className = 'comment-content';
            contentElem.textContent = comment.content;
            commentDiv.appendChild(contentElem);
            
            // 4. 첨부 파일 처리 (있는 경우) -> 댓글 본문 아래에 추가
            if (comment.attachments) {
              try {
                const attachments = JSON.parse(comment.attachments);
                if (Array.isArray(attachments) && attachments.length > 0) {
                  const attachmentsDiv = document.createElement('div');
                  attachmentsDiv.className = 'comment-attachments';
                  attachmentsDiv.style.marginTop = '10px';
                  attachments.forEach(filePath => {
                    const link = document.createElement('a');
                    link.href = filePath;
                    link.textContent = filePath.split('/').pop();
                    link.download = '';
                    link.style.display = 'block';
                    link.style.color = '#0060ff';
                    attachmentsDiv.appendChild(link);
                  });
                  commentDiv.appendChild(attachmentsDiv);
                }
              } catch (e) {
                console.error('첨부파일 파싱 오류:', e);
              }
            }
            
            // 5. 댓글 클릭 시 답글 입력창 토글 (내부 클릭은 닫히지 않음)
            commentDiv.addEventListener('click', () => {
              let replyInput = commentDiv.querySelector('.reply-input');
              if (replyInput) {
                replyInput.style.display = (replyInput.style.display === 'none' ? 'block' : 'none');
              } else {
                replyInput = createReplyInput(comment.id, commentDiv);
                commentDiv.appendChild(replyInput);
                replyInput.style.display = 'block';
              }
            });
            
            // 6. 기존 답글 렌더링 (있는 경우)
            if (comment.replies && Array.isArray(comment.replies)) {
              const repliesContainer = document.createElement('div');
              repliesContainer.className = 'replies-container';
              comment.replies.forEach(reply => {
                const replyDiv = document.createElement('div');
                replyDiv.className = 'reply';
                replyDiv.innerHTML = `
                  <div class="comment-header">
                    <span class="comment-author">${reply.author}</span> | 
                    <span class="comment-date">${reply.date}</span>
                  </div>
                  <div class="comment-content">${reply.content}</div>
                `;
                repliesContainer.appendChild(replyDiv);
              });
              commentDiv.appendChild(repliesContainer);
            }
            
            commentsList.appendChild(commentDiv);
          });
        }
  
    // 생성된 답글 입력창 생성 (내부 클릭 시 닫히지 않음)
    function createReplyInput(commentId, parentDiv) {
      const div = document.createElement('div');
      div.className = 'reply-input';
      div.style.width = '90%';
      div.style.margin = '10px auto';
      div.style.padding = '5px';
      div.style.border = '1px solid #ccc';
      div.style.borderRadius = '4px';
      div.innerHTML = `
        <textarea rows="2" placeholder="답글을 입력하세요" style="width: 97%; padding: 5px; border: 1px solid #ddd; border-radius: 4px;"></textarea>
        <button class="submit-reply" style="margin-top: 5px; background-color: #002147; border: none; color: #fff; padding: 5px 10px; border-radius: 4px; cursor: pointer;">등록</button>
      `;
      // 내부 클릭 이벤트 전파 방지
      div.addEventListener('click', (e) => {
        e.stopPropagation();
      });
      const submitReplyBtn = div.querySelector('.submit-reply');
      submitReplyBtn.addEventListener('click', () => {
        const replyText = div.querySelector('textarea').value.trim();
        if (!replyText) {
          alert('답글 내용을 입력하세요.');
          return;
        }
        submitReply(commentId, replyText, parentDiv, div);
      });
      return div;
    }
  
    // 답글 제출
    function submitReply(commentId, content, parentDiv, inputDiv) {
      fetch(`/api/boards/${boardId}/comments/${commentId}/reply`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': localStorage.getItem('token') ? `Bearer ${localStorage.getItem('token')}` : ''
        },
        body: JSON.stringify({ content })
      })
      .then(res => {
        if (!res.ok) throw new Error('답글 작성 실패');
        return res.json();
      })
      .then(reply => {
        const replyElem = document.createElement('div');
        replyElem.className = 'reply';
        replyElem.innerHTML = `
          <div class="comment-header">
            <span class="comment-author">${reply.author}</span> | 
            <span class="comment-date">${reply.date}</span>
          </div>
          <div class="comment-content">${reply.content}</div>
        `;
        parentDiv.appendChild(replyElem);
        inputDiv.remove();
      })
      .catch(err => {
        console.error(err);
        alert('답글 작성 중 오류가 발생했습니다.');
      });
    }
      // 파일 선택 후 파일명 업데이트
    commentPhotoInput.addEventListener('change', () => {
      if (commentPhotoInput.files.length > 0) {
        commentAttachmentFilenames.innerHTML = `<div>${commentPhotoInput.files[0].name}</div>`;
      } else {
        commentAttachmentFilenames.innerHTML = '';
      }
    });
    commentFilesInput.addEventListener('change', () => {
      let html = '';
      for (let i = 0; i < commentFilesInput.files.length; i++) {
        html += `<div>${commentFilesInput.files[i].name}</div>`;
      }
      // 파일첨부가 있으면 기존의 photo 파일명도 함께 표시 (photo 파일은 단일)
      if (commentPhotoInput.files.length > 0) {
        // 이미 commentAttachmentFilenames에 photo의 이름이 있으면 유지하고, 파일들의 이름만 추가
        html = commentAttachmentFilenames.innerHTML + html;
      }
      commentAttachmentFilenames.innerHTML = html;
    });
    // 새 댓글 작성
    submitCommentButton.addEventListener('click', () => {
      const content = newCommentTextarea.value.trim();
      if (!content) {
        alert('댓글 내용을 입력하세요.');
        return;
      }
      const formData = new FormData();
      formData.append('content', content);
      // 단일 사진 첨부 (선택된 경우)
      if (commentPhotoInput.files && commentPhotoInput.files.length > 0) {
        formData.append('photo', commentPhotoInput.files[0]);
      }
      // 파일 첨부 (여러 개)
      if (commentFilesInput.files && commentFilesInput.files.length > 0) {
        for (let i = 0; i < commentFilesInput.files.length; i++) {
          formData.append('files', commentFilesInput.files[i]);
        }
      }
      fetch(`/api/boards/${boardId}/comments`, {
        method: 'POST',
        headers: {
          'Authorization': localStorage.getItem('token') ? `Bearer ${localStorage.getItem('token')}` : ''
          // Content-Type는 FormData 사용 시 자동 설정됨
        },
        body: formData
      })
      .then(res => {
        if (!res.ok) throw new Error('댓글 작성 실패');
        return res.json();
      })
      .then(newComment => {
        newCommentTextarea.value = '';
        // 초기화: 파일 입력값 지우기 및 파일명 영역 비우기
        commentPhotoInput.value = '';
        commentFilesInput.value = '';
        commentAttachmentFilenames.innerHTML = '';
        loadComments();
      })
      .catch(err => {
        console.error(err);
        alert('댓글 작성 중 오류가 발생했습니다.');
      });
    });
    
  
    // 뒤로가기 버튼
    backButton.addEventListener('click', (e) => {
      e.preventDefault();
      history.back();
    });
  
    // 초기 로딩
    loadBoard();
    loadComments();
  });
  