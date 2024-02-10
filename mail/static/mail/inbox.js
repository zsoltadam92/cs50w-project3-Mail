document.addEventListener('DOMContentLoaded', function() {

  // Use buttons to toggle between views
  ['inbox', 'sent', 'archive', 'compose'].forEach(id => {
    const button = document.querySelector(`#${id}`);
    button.addEventListener('click', () => {
      if (id === 'compose') {
        compose_email();
      } else {
        load_mailbox(id);
      }
    });
  });

  document.querySelector('#compose-form').addEventListener('submit', send_email);

  // By default, load the inbox
  load_mailbox('inbox');
});

function compose_email() {

  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#email-details').style.display = 'none';
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
      const emailDiv = document.createElement('div')
      emailDiv.classList.add('d-flex', 'justify-content-between' ,'list-group-item', 'list-group-item-action', email.read ? 'list-group-item-light' : 'list-group-item-secondary', 'email-box')
    
      
      emailDiv.innerHTML = `
        <strong class="mr-2">${email.sender}</strong>
        <span class="mr-2">${email.subject}</span>
        <span class="mr-2">${email.timestamp}</span>
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
          <div> ${email.body.replace(/\n/g, "<br>")}</div>
          <button id="reply"  class="btn btn-info mt-3">Reply</button>
      `;

      if (mailbox !== 'sent') {
        emailDetailsDiv.innerHTML += `
            <button id="archived" class="btn btn-secondary mt-3">${email.archived ? "Unarchive" : "Archive"}</button>
        `;
        document.querySelector('#archived').addEventListener('click',() => archive_unarchive_emails(email_id,mailbox))
    }
        document.querySelector('#reply').addEventListener('click',() => {
          document.querySelector('#emails-view').style.display = 'none';
          document.querySelector('#email-details').style.display = 'none';
          document.querySelector('#compose-view').style.display = 'block';

          document.querySelector('#compose-recipients').value = email.sender;
          document.querySelector('#compose-subject').value = email.subject.includes("Re: ")? email.subject : "Re: " + email.subject;
          document.querySelector('#compose-body').innerHTML =  `
          
          On ${email.timestamp} ${email.sender} wrote: 

          ${email.body}

          `;

        })

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

function archive_unarchive_emails(email_id,mailbox) {
  fetch(`/emails/${email_id}`, {
    method: 'PUT',
    body: JSON.stringify({
        archived: mailbox === 'inbox' ? true : false
    })
})
.then(() => load_mailbox('inbox')) // Reload the inbox after archiving
.catch(error => console.error('Error archiving email:', error));
}