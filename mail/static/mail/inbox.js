document.addEventListener('DOMContentLoaded', function() {

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', compose_email);
  document.querySelector('#compose-form').addEventListener('submit', send_email);

  // By default, load the inbox
  load_mailbox('inbox');
});

function compose_email() {

  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';

  // Clear out composition fields
  document.querySelector('#compose-recipients').value = '';
  document.querySelector('#compose-subject').value = '';
  document.querySelector('#compose-body').value = '';
}

function load_mailbox(mailbox) {
  
  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#email-details').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'none';

  // Show the mailbox name
  document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;

  fetch(`/emails/${mailbox}`)
  .then(response => response.json())
  .then(emails => {
    emails.forEach(email => {
      console.log(email);
      const emailDiv = document.createElement('div')
      emailDiv.classList.add('email-box')
      if (email.read) {
        emailDiv.classList.add('read')
      } else {
        emailDiv.classList.add('unread')
      }
      
      emailDiv.innerHTML = `
        <strong>${email.sender}</strong>
        <span>${email.subject}</span>
        <span>${email.timestamp}</span>
      `
      emailDiv.addEventListener('click', () => view_email(email.id,mailbox))
      document.querySelector('#emails-view').append(emailDiv)
    })
  })
  .catch(error => console.error('Error loading mailbox:', error));
}

function send_email(event) {
  event.preventDefault()

  const recipients = document.querySelector('#compose-recipients').value;
  const subject = document.querySelector('#compose-subject').value;
  const body = document.querySelector('#compose-body').value;

  fetch('/emails', {
      method: 'POST',
      body: JSON.stringify({
          recipients: recipients,
          subject: subject,
          body: body
      })
  })
  .then(response => response.json())
  .then(result => {
    console.log(result)
    load_mailbox('sent');
  })
  .catch(error => {
    console.error('Error:', error);
  });

}

function view_email(email_id, mailbox) {
  // Make a GET request to fetch the email details
  fetch(`/emails/${email_id}`)
  .then(response => response.json())
  .then(email => {
      // Display the email details in the email view
      const emailDetailsDiv = document.querySelector('#email-details');
      emailDetailsDiv.innerHTML = `
          <strong>From:</strong> ${email.sender}<br>
          <strong>To:</strong> ${email.recipients.join(', ')}<br>
          <strong>Subject:</strong> ${email.subject}<br>
          <strong>Timestamp:</strong> ${email.timestamp}<br>
          <hr>
          <div>${email.body}</div>
      `;

      // Show the email view and hide the mailbox view
      document.querySelector('#emails-view').style.display = 'none';
      document.querySelector('#email-details').style.display = 'block';

      // Mark the email as read
      if (mailbox === 'inbox' && !email.read) {
          mark_email_as_read(email_id);
      }
  })
  .catch(error => console.error('Error loading email:', error));
}

function mark_email_as_read(email_id) {
  // Make a PUT request to mark the email as read
  fetch(`/emails/${email_id}`, {
      method: 'PUT',
      body: JSON.stringify({
          read: true
      })
  })
  .then(response => {
      if (!response.ok) {
          throw new Error('Failed to mark email as read');
      }
  })
  .catch(error => console.error('Error marking email as read:', error));
}