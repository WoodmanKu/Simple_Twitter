const showCommentBtns = document.querySelectorAll('.show-comment-btn');
const choice = button.dataset.likeDislike;

showCommentBtns.forEach((btn) => {
  btn.addEventListener('click', () => {
    const commentBox = btn.parentElement.querySelector('.comment-form');
    const commentList = btn.parentElement.querySelector('.comment-list');
    if (commentBox.style.display === 'none') {
      commentBox.style.display = 'block';
    } else {
      commentBox.style.display = 'none';
    }
    commentList.style.display = 'block';
  });
});

const commentForms = document.querySelectorAll('.comment-form');

commentForms.forEach((form) => {
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const postId = form.action.split('/').pop();
    const comment = form.comment.value;
    const response = await fetch(`/comment/${postId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ comment })
    });
    if (response.ok) {
      location.reload();
    }
  });
});