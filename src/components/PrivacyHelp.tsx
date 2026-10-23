export function PrivacyHelp() {
  return (
    <section className="privacy" aria-labelledby="privacy-title">
      <h2 id="privacy-title">Privacy and help</h2>
      <ul>
        <li>FollowCheck never asks for your Instagram password, and never logs in to Instagram for you.</li>
        <li>
          Your ZIP is opened and compared inside your browser. It is not uploaded anywhere, and nothing is saved.
          Closing or refreshing the page clears the results.
        </li>
        <li>Results come from the export you upload. They show the state on the export date, not live data.</li>
        <li>
          Need an export? Follow Instagram's{' '}
          <a href="https://help.instagram.com/181231772500920" target="_blank" rel="noopener noreferrer">
            official guide to downloading your data
          </a>{' '}
          or open{' '}
          <a href="https://accountscenter.instagram.com/info_and_permissions/dyi/" target="_blank" rel="noopener noreferrer">
            Accounts Center
          </a>
          . Choose <em>Followers and following</em> and the <em>JSON</em> format. Instagram's screens change, so the
          official pages are the reliable reference.
        </li>
      </ul>
      <p className="muted">FollowCheck is an independent tool and is not affiliated with or endorsed by Instagram or Meta.</p>
    </section>
  )
}
