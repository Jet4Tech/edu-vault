export default function TermsOfServicePage() {
  const lastUpdated = new Date().toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="prose prose-slate mx-auto max-w-3xl px-4 py-12">
      <h1>Terms of Service</h1>
      <p className="text-muted-foreground">Last updated: {lastUpdated}</p>

      <p>
        These Terms of Service (&quot;Terms&quot;) govern your use of Edu-Vault (the
        &quot;Platform&quot;). By creating an account or using the Platform, you agree to
        these Terms.
      </p>

      <h2>1. The Platform</h2>
      <p>
        Edu-Vault is a marketplace where Sellers can list and sell digital
        educational resources (&quot;Resources&quot;) to Buyers. We are not a party to the
        transaction between Buyers and Sellers; we provide the platform that
        facilitates it.
      </p>

      <h2>2. Accounts</h2>
      <ul>
        <li>You must provide accurate information when creating an account.</li>
        <li>You are responsible for keeping your account credentials secure.</li>
        <li>You must be old enough to lawfully use this service in your jurisdiction.</li>
      </ul>

      <h2>3. Selling on Edu-Vault</h2>
      <ul>
        <li>
          Sellers must connect a Stripe account and complete onboarding before
          publishing Resources for sale.
        </li>
        <li>
          Sellers must own or have the right to sell the content they upload, and
          must not upload content that infringes the intellectual property rights of
          others.
        </li>
        <li>
          Edu-Vault deducts a platform fee from each sale as disclosed at checkout
          before transferring the remaining amount to the Seller.
        </li>
        <li>
          Sellers are responsible for the accuracy of their product listings,
          including descriptions, pricing, and previews.
        </li>
      </ul>

      <h2>4. Buying on Edu-Vault</h2>
      <ul>
        <li>
          All purchases are for a single, perpetual license to download and use the
          Resource for your own personal or educational use, unless otherwise stated
          by the Seller.
        </li>
        <li>
          Resources are digital products delivered electronically. Once a download
          link has been issued, the sale is generally final, except as required by
          law or at our discretion in cases of error or technical fault.
        </li>
        <li>
          You may not redistribute, resell, or share purchased Resources without the
          Seller&apos;s permission.
        </li>
      </ul>

      <h2>5. Payments</h2>
      <p>
        Payments are processed by Stripe. By making a purchase or connecting a
        Seller account, you also agree to Stripe&apos;s terms of service. Edu-Vault is
        not responsible for delays or issues caused by Stripe or your bank.
      </p>

      <h2>6. Prohibited Conduct</h2>
      <ul>
        <li>Uploading unlawful, infringing, or harmful content.</li>
        <li>Attempting to circumvent payment or platform fees.</li>
        <li>Misrepresenting your identity or the nature of a Resource.</li>
        <li>Interfering with the security or normal operation of the Platform.</li>
      </ul>

      <h2>7. Termination</h2>
      <p>
        We may suspend or terminate accounts that violate these Terms or pose a risk
        to the Platform, its users, or third parties.
      </p>

      <h2>8. Disclaimers and Limitation of Liability</h2>
      <p>
        The Platform is provided &quot;as is&quot; without warranties of any kind. To the
        maximum extent permitted by law, Edu-Vault is not liable for indirect,
        incidental, or consequential damages arising from your use of the Platform.
      </p>

      <h2>9. Changes to These Terms</h2>
      <p>
        We may update these Terms from time to time. Continued use of the Platform
        after changes take effect constitutes acceptance of the updated Terms.
      </p>

      <h2>10. Contact Us</h2>
      <p>
        If you have questions about these Terms, please contact us through the
        support channels listed on our platform.
      </p>
    </div>
  );
}
