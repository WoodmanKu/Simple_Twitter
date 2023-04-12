function deleteUser(username) {
  if (confirm("Are you sure you want to delete this user?")) {
    fetch(`/users/${username}`, {
      method: 'PUT',
      body: JSON.stringify({ status: false }),
      headers: {
        'Content-Type': 'application/json'
      }
    })
    .then(response => {
      if (!response.ok) {
        throw new Error('Failed to delete user');
      }
      // Update the UI to reflect the deleted user
      document.getElementById(`delete-btn-${username}`).parentNode.parentNode.remove();
    })
    .catch(error => console.error(error));
  }
}