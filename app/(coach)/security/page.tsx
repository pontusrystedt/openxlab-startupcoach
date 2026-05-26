import { requireCoach } from "@/lib/access"

export const metadata = { title: "Datasäkerhet — OpenX Lab Startupcoach" }

export default async function SecurityPage() {
  await requireCoach()

  return (
    <div className="max-w-3xl mx-auto px-6 py-10">

      <div className="mb-10 p-6 rounded-xl bg-slate-900 text-white">
        <h1 className="text-2xl font-semibold mb-1">Datasäkerhet och dataintegritet</h1>
        <p className="text-slate-400 text-sm">
          Version 1.0 · Maj 2026 · OpenX Lab Startupcoach
        </p>
      </div>

      <div className="mb-8 p-4 rounded-lg border border-green-200 bg-green-50">
        <p className="font-medium text-green-900 text-sm mb-1">Kärnprincipen</p>
        <p className="text-green-800 text-sm">
          Ni äger er data. Vi förvaltar den.
          Ingen tredje part äger, tränar på eller säljer den vidare.
        </p>
      </div>

      <SecuritySection title="1. Dataägande">
        <p>Licenstagaren äger all data i systemet — transkriptioner, dokument,
        startup-profiler, todos och AI-genererat innehåll. OpenX Lab har inte rätt
        att använda er data för egna ändamål eller dela den med andra kunder.</p>
        <p className="mt-2">Dataexport är alltid tillgänglig: all data kan exporteras
        i öppna format (JSON, PDF) utan kostnad och utan teknisk inlåsning.</p>
      </SecuritySection>

      <SecuritySection title="2. Serverinfrastruktur">
        <SecurityTable rows={[
          ["Applikationsserver", "Hetzner Cloud, Europa (EU)"],
          ["Databas", "PostgreSQL — EU-baserad"],
          ["Fillagring", "Hetzner Object Storage, EU — krypterat med kundägd nyckel (SSE-C)"],
          ["Deployment", "Coolify (open source, självhostat) — inga US-molntjänster"],
          ["Nätverkskryptering", "TLS 1.2+"],
          ["Migrationsberedskap", "Förberedd för Cleura Cloud — byte av config, ingen omskrivning"],
        ]} />
      </SecuritySection>

      <SecuritySection title="3. Kryptering">
        <SecurityTable rows={[
          ["Data i transit", "TLS 1.2+ för all kommunikation"],
          ["Transkriptioner i databasen", "AES-256-GCM, unik IV per post, nyckel aldrig i DB"],
          ["Sessionssummor i databasen", "AES-256-GCM, samma mönster"],
          ["Filer i objektlagringen", "SSE-C: krypteras med er nyckel, Hetzner lagrar aldrig nyckeln"],
          ["Lösenord", "bcrypt med salt"],
          ["TOTP-hemligheter", "AES-256-GCM, krypterade i databasen"],
        ]} />
      </SecuritySection>

      <SecuritySection title="4. Åtkomstkontroll">
        <SecurityTable rows={[
          ["SystemAdmin", "OpenX Lab — teknisk administration"],
          ["ClientAdmin", "Er administratör — skapar/inaktiverar coaches"],
          ["Coach", "Ser alla startups i sin organisation, aldrig annan organisations data"],
          ["Entrepreneur", "Ser enbart sina egna startups och kan aldrig se andra"],
        ]} />
        <p className="mt-3 text-sm text-gray-600">
          Dataisolering är implementerad på databasnivå — inte enbart i UI.
        </p>
      </SecuritySection>

      <SecuritySection title="5. Inloggningssäkerhet">
        <SecurityTable rows={[
          ["Autentiseringsmetod", "E-post + lösenord + TOTP (Authenticator-app)"],
          ["Tvåfaktorsautentisering", "TOTP via Google Authenticator, Authy eller liknande"],
          ["Lösenordsskydd", "bcrypt med salt — brute force-skyddad"],
          ["Sessionshantering", "Krypterade JWT-tokens, server-side validering av varje anrop"],
          ["Inaktiva konton", "Blockeras omedelbart vid inloggningsförsök"],
        ]} />
      </SecuritySection>

      <SecuritySection title="6. Externa tjänster">
        <h3 className="font-medium text-gray-900 mb-2">Klang.ai — transkription</h3>
        <SecurityTable rows={[
          ["Ursprung", "Byggt i Sverige, EU-jurisdiktion"],
          ["Servrar", "Frankrike (Scaleway — europeisk molnleverantör)"],
          ["Certifieringar", "ISO 27001, ISO 42001, EU AI Act-compliant, GDPR baseline"],
          ["Träning på kunddata", "Aldrig"],
          ["Cloud Act-exponering", "Ingen — europeiskt bolag"],
        ]} />
        <h3 className="font-medium text-gray-900 mt-4 mb-2">Mistral AI — AI-analys</h3>
        <SecurityTable rows={[
          ["Ursprung", "Franskt bolag, EU-jurisdiktion"],
          ["Träning på kunddata", "Nej — API-kunder är opt-out som standard"],
          ["Datacenter", "EU-baserade, egen infrastruktur i Frankrike sedan juni 2025"],
          ["Cloud Act-exponering", "Ingen — europeiskt bolag"],
          ["DPA", "Tillgängligt för API-kunder"],
        ]} />
      </SecuritySection>

      <SecuritySection title="7. GDPR">
        <p className="mb-2">Licenstagaren är personuppgiftsansvarig (Controller).
        OpenX Lab är personuppgiftsbiträde (Processor). DPA ingår i licensavtalet.</p>
        <SecurityTable rows={[
          ["Dataminimering", "Enbart nödvändiga uppgifter samlas in"],
          ["Raderingsrätt", "Data raderas vid begäran, inklusive hos Klang.ai"],
          ["Dataportabilitet", "Export i JSON/PDF tillgänglig när som helst"],
          ["Incidentrapportering", "Till IMY inom 72 timmar per GDPR artikel 33"],
        ]} />
      </SecuritySection>

      <SecuritySection title="8. Kontakt">
        <SecurityTable rows={[
          ["Personuppgiftsbiträde", "OpenX Lab AB, Ideon Science Park, Lund"],
          ["Säkerhetsincident", "Kontakta OpenX Lab → rapporteras till IMY inom 72h"],
          ["Dataexport eller radering", "Begär via er ClientAdmin eller direkt till OpenX Lab"],
        ]} />
      </SecuritySection>

      <div className="mt-10 p-5 rounded-xl bg-slate-900 text-center">
        <p className="text-white font-medium">Era affärshemligheter är era.</p>
        <p className="text-slate-400 text-sm mt-1">Vi tar det ansvaret på fullaste allvar.</p>
      </div>

    </div>
  )
}

function SecuritySection({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <section className="mb-8">
      <h2 className="text-lg font-semibold text-gray-900 mb-3 pb-2 border-b border-gray-200">
        {title}
      </h2>
      <div className="text-sm text-gray-700 leading-relaxed">{children}</div>
    </section>
  )
}

function SecurityTable({ rows }: { rows: [string, string][] }) {
  return (
    <table className="w-full text-sm border-collapse">
      <tbody>
        {rows.map(([label, value]) => (
          <tr key={label} className="border-b border-gray-100 last:border-0">
            <td className="py-2 pr-4 font-medium text-gray-700 w-48 align-top">
              {label}
            </td>
            <td className="py-2 text-gray-600 align-top">{value}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
