"use client"

import { useState } from "react"
import { requireCoach } from "@/lib/access"

// Page is server-guarded via layout — client component for tabs

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-8">
      <h2 className="text-lg font-semibold text-gray-900 mb-3 pb-2 border-b border-gray-200">{title}</h2>
      <div className="space-y-3 text-sm text-gray-700 leading-relaxed">{children}</div>
    </div>
  )
}

function SubSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-4">
      <h3 className="font-semibold text-gray-800 mb-2">{title}</h3>
      <div className="space-y-2 text-sm text-gray-700 leading-relaxed">{children}</div>
    </div>
  )
}

function Th({ children }: { children: React.ReactNode }) {
  return <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 bg-gray-50 border border-gray-200">{children}</th>
}
function Td({ children }: { children: React.ReactNode }) {
  return <td className="px-3 py-2 text-xs text-gray-700 border border-gray-200 align-top">{children}</td>
}

function PBA() {
  return (
    <div>
      <div className="mb-6 p-4 rounded-lg bg-amber-50 border border-amber-200">
        <p className="text-sm text-amber-900 font-medium">
          Detta avtal fylls i och signeras vid tecknande av licens. Kontakta OpenX Lab AB för att påbörja processen.
        </p>
      </div>

      <div className="mb-8 p-5 rounded-xl bg-[#1A1A2E] text-white">
        <h1 className="text-xl font-semibold mb-1">PERSONUPPGIFTSBITRÄDESAVTAL</h1>
        <p className="text-[#AAAACC] text-sm">Data Processing Agreement — OpenX Lab Startupcoach</p>
        <p className="text-[#AAAACC] text-sm mt-1">Version 1.0 · Maj 2026 · Artikel 28 GDPR</p>
      </div>

      <Section title="Parter">
        <p>Detta Personuppgiftsbiträdesavtal ("PBA" eller "DPA") ingås i enlighet med artikel 28 i Dataskyddsförordningen (GDPR) mellan:</p>

        <SubSection title="Personuppgiftsansvarig (Controller)">
          <table className="w-full border-collapse text-xs">
            <tbody>
              {[
                ["Bolag", "OpenX Lab AB"],
                ["Org.nr", "559309-7326"],
                ["Adress", "Drapavägen 31, 224 74 Lund, Sverige"],
                ["Roll", "Personuppgiftsansvarig — tillhandahåller Startupcoach-plattformen"],
                ["Kontakt", "Pontus.rystedt@openxlab.se"],
              ].map(([k, v]) => (
                <tr key={k}>
                  <Th>{k}</Th>
                  <Td>{v}</Td>
                </tr>
              ))}
            </tbody>
          </table>
        </SubSection>

        <SubSection title="Personuppgiftsbiträde (Processor) — Licenstagare">
          <p>Den organisation som tecknar licens för Startupcoach, härefter "Licenstagaren", med följande uppgifter att fylla i vid avtalstecknande:</p>
          <table className="w-full border-collapse text-xs mt-2">
            <tbody>
              {[
                ["Bolag", "[Licenstagarens juridiska namn]"],
                ["Org.nr", "[Organisationsnummer]"],
                ["Adress", "[Postadress]"],
                ["Kontaktperson", "[Namn, Efternamn]"],
                ["Email", "[e-post]"],
                ["Roll", "Personuppgiftsbiträde för startupdata och coachinginformation"],
              ].map(([k, v]) => (
                <tr key={k}>
                  <Th>{k}</Th>
                  <td className={`px-3 py-2 text-xs border border-gray-200 align-top ${v.startsWith("[") ? "italic text-gray-400" : "text-gray-700"}`}>{v}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </SubSection>

        <p>Parterna benämns nedan gemensamt "Parterna" och var för sig "Part".</p>
      </Section>

      <Section title="§ 1 Bakgrund och syfte">
        <p>OpenX Lab AB tillhandahåller Startupcoach — en SaaS-plattform för AI-stödd startupcoaching. Licenstagaren köper tillgång till plattformen och behandlar i samband med detta personuppgifter tillhörande startupteammedlemmar, coacher och andra registrerade personer.</p>
        <p>Detta avtal reglerar hur Licenstagaren, i egenskap av personuppgiftsbiträde, får behandla personuppgifter på OpenX Lab ABs vägnar, och vilka skyldigheter respektive rättigheter Parterna har.</p>
        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
          <p className="font-semibold text-green-900 text-xs mb-1">Kärnprincipen</p>
          <p className="text-green-800 text-xs">Registrerades personuppgifter ägs av de registrerade. Affärshemligheter och coachingdata ägs av Licenstagaren. OpenX Lab AB äger systemet och dess arkitektur. Ingen part får använda en annan parts data för egna syften.</p>
        </div>
      </Section>

      <Section title="§ 2 Dataägarskap och behörigheter">
        <p>Systemet hanterar tre kategorier av data med olika ägarskap och behandlingsregler.</p>

        <SubSection title="2.1 OpenX Labs data (systemleverantör)">
          <p><strong>OpenX Lab AB äger:</strong></p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Systemets arkitektur, kod, affärslogik och AI-modeller</li>
            <li>Aggregerade anonymiserade insikter om systemprestanda (ej kopplat till enskild org eller startup)</li>
            <li>Tekniska loggar för drift och säkerhet</li>
            <li>Promptmallar och agentdefinitioner</li>
          </ul>
          <p className="mt-2"><strong>OpenX Lab AB får:</strong></p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Använda tekniska driftsloggar för felsökning och systemförbättring</li>
            <li>Använda anonymiserade, ej identifierbara aggregatdata för att förbättra systemet</li>
          </ul>
          <p className="mt-2"><strong>OpenX Lab AB får INTE:</strong></p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Läsa, analysera eller dela enskild startupdata, transkriptioner eller coachingnoteringar</li>
            <li>Använda Licenstagarens data för marknadsföring eller försäljning</li>
            <li>Ge tredje part tillgång till Licenstagarens data utan uttryckligt skriftligt medgivande</li>
          </ul>
        </SubSection>

        <SubSection title="2.2 Licenstagarens data (inkubator/coachingorganisation)">
          <p><strong>Licenstagaren (representerad av ClientAdmin och Coacher) äger:</strong></p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Alla startupprofiler och grunddata som lagts in i systemet</li>
            <li>Alla mötestranskriptioner och inspelningar</li>
            <li>Coachingnoteringar, IRL-profiler, todos och sessionssummor</li>
            <li>Uppladdade filer och dokument</li>
            <li>Knowledge-repositoryt (filer, länkar, screeningfrågor)</li>
            <li>Beslut (Decisions) och screeningbedömningar</li>
          </ul>
          <p className="mt-2"><strong>Licenstagaren får:</strong></p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Behandla all sin data inom systemet för sitt coachingändamål</li>
            <li>Dela specifik data med berörda startups (via Entrepreneur-rollen)</li>
            <li>Exportera all sin data i öppna format (JSON, PDF) när som helst</li>
            <li>Använda AI-genererade insikter internt för att förbättra sin coachingverksamhet</li>
            <li>Dela anonymiserade framgångssiffror externt för marknadsföring (se §2.4)</li>
          </ul>
          <p className="mt-2"><strong>Licenstagaren får INTE:</strong></p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Dela en startups data med annan startup utan uttryckligt samtycke</li>
            <li>Använda transkriptioner eller coachingdata för ändamål utanför coachingrelationen</li>
            <li>Sälja eller licensiera startupdata till tredje part</li>
          </ul>
        </SubSection>

        <SubSection title="2.3 Entreprenörens data">
          <p><strong>Entreprenören (startupteammedlem) äger:</strong></p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Sina egna personuppgifter (namn, kontaktinformation)</li>
            <li>Den information som hen personligen bidragit med i möten och dokument</li>
          </ul>
          <p className="mt-2"><strong>Entreprenören får:</strong></p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Se och redigera sina egna personuppgifter</li>
            <li>Se sin startups todos, IRL-profil och mötessammanfattningar (den del som är avsedd för dem)</li>
            <li>Ladda upp filer relevanta för sin startup</li>
            <li>Begära utdrag eller radering av sina personuppgifter (GDPR Art. 15–17)</li>
            <li>Se fullständiga transkriptioner från möten där det egna företaget deltagit</li>
          </ul>
          <p className="mt-2"><strong>Entreprenören får INTE:</strong></p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Se andra startupars data</li>
            <li>Se transkriptioner av andra möten där entreprenörens företag inte deltagit.</li>
            <li>Se coachens interna noteringar</li>
            <li>Ändra data som tillhör coachingprocessen (t.ex. IRL-scoring, coachnoteringar)</li>
          </ul>
        </SubSection>

        <SubSection title="2.4 Gemensamt skapad data (möten)">
          <p>Data som skapas i coachingmöten — transkriptioner, sammanfattningar, todos — är resultatet av ett samarbete men ägs i sin helhet av Licenstagaren, eftersom det är Licenstagarens coachingprocess.</p>
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 mt-2">
            <p className="font-semibold text-xs mb-1">Behandlingsregel för mötesdata</p>
            <p className="text-xs">Transkriptioner och summor får användas för: (1) direkt coachingstöd till den berörda startupen, (2) internt kvalitetsarbete inom Licenstagarens organisation. De får inte delas med andra startups, externa parter eller användas för träning av AI-modeller utan samtycke.</p>
          </div>
        </SubSection>

        <SubSection title="2.5 AI-genererade insikter">
          <p>Insikter genererade av AI-agenter (todos, screeningbedömningar, IRL-uppdateringar, nyckelord) skapas på uppdrag av Licenstagaren och ägs av Licenstagaren. OpenX Lab AB behåller inga kopior av dessa insikter utanför Licenstagarens datamiljö.</p>
          <p><strong>Licenstagaren får använda AI-insikter för:</strong></p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Direkt coachingstöd och uppföljning</li>
            <li>Intern rapportering till finansiärer (med de begränsningar som anges i §2.3)</li>
            <li>Anonymiserad statistik för marknadsföring (t.ex. "X% av våra startups når IRL 6 inom 12 månader" — utan identifierande uppgifter)</li>
          </ul>
          <p className="mt-2"><strong>AI-insikter får INTE:</strong></p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Användas som enda beslutsunderlag för att neka en startup tillgång till program (GDPR Art. 22 — automatiserade beslut)</li>
            <li>Delas med tredje part utan att den berörda startupens samtycke inhämtats</li>
          </ul>
        </SubSection>
      </Section>

      <Section title="§ 3 Radering av data">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-xs">
            <thead>
              <tr>
                <Th>Datatyp</Th>
                <Th>Behörig att radera</Th>
                <Th>Tidpunkt</Th>
                <Th>Konsekvens</Th>
              </tr>
            </thead>
            <tbody>
              {[
                ["Personuppgifter (enskild)", "Registrerad person via begäran, eller ClientAdmin", "På begäran, inom 30 dagar", "Uppgifterna anonymiseras — relaterad coachindata bevaras"],
                ["Startupprofil", "ClientAdmin eller Coach", "Vid avslutad relation", "Startupen arkiveras eller raderas beroende på val"],
                ["Transkription", "Coach eller ClientAdmin", "Löpande eller vid avslutat program", "Summering och todos kan bevaras separat"],
                ["Coachingdata (alla sessioner)", "ClientAdmin", "Vid avslutat licensavtal", "Export erbjuds före radering — se §5"],
                ["Entrepreneurkonto", "Entrepreneur själv, eller ClientAdmin", "På begäran", "Personuppgifter raderas, anonymiserade bidrag bevaras"],
                ["All Licenstagarens data", "ClientAdmin", "Vid uppsagd licens", "Export erbjuds — data raderas inom 30 dagar efter export"],
              ].map((row) => (
                <tr key={row[0]}>
                  {row.map((cell, i) => <Td key={i}>{cell}</Td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3">Radering är permanent och kan inte ångras. OpenX Lab AB raderar data i enlighet med Licenstagarens instruktioner. Hetzner Online GmbH raderar fysiska lagringsmedia i enlighet med sitt DPA (version 1.2, 2026) om data inte kan raderas på annat sätt.</p>
      </Section>

      <Section title="§ 4 Delning av insikter — balans mellan öppenhet och sekretess">
        <p>Startupcoach är utformat för att möjliggöra samarbete inom en organisation utan att affärshemligheter läcker mellan startups eller till obehöriga parter.</p>

        <SubSection title="4.1 Vad får delas och med vem">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-xs">
              <thead>
                <tr>
                  <Th>Data</Th>
                  <Th>Coach</Th>
                  <Th>Entrepreneur (sin startup)</Th>
                  <Th>Extern part</Th>
                </tr>
              </thead>
              <tbody>
                {[
                  ["Startupprofil och grunddata", "✓ Alla", "✓ Egen", "✗"],
                  ["Mötessummering (insikt)", "✓ Alla", "✓ Egen (förenklad)", "✗"],
                  ["Coachens interna noteringar", "✓ Alla", "✗", "✗"],
                  ["Todos", "✓ Alla", "✓ Egna", "✗ (ej extern)"],
                  ["Fullständig transkription", "✓ Alla", "✗", "✗"],
                  ["IRL-profil", "✓ Alla", "✓ Egen", "✗"],
                  ["Decisions", "✓ Alla coaches", "✗", "✗"],
                  ["AI-screeninganalys", "✓ Alla coaches", "✗", "✗"],
                  ["Knowledge-repo", "✓ Alla", "✓ (delvis)", "✗"],
                  ["Anonymiserad kohortsstatistik", "✓", "✗", "✓ Med samtycke"],
                ].map((row) => (
                  <tr key={row[0]}>
                    {row.map((cell, i) => <Td key={i}>{cell}</Td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SubSection>

        <SubSection title="4.2 Externt delande">
          <p>Extern delning av icke-anonymiserade insikter kräver:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Skriftligt samtycke från berörd startup (kontaktpersonens underskrift)</li>
            <li>Dokumenterat syfte (t.ex. investerarpresentation, pressrelease)</li>
            <li>Avgränsning — enbart specificerad information, inte hela datamängden</li>
          </ul>
          <p className="mt-2">Anonymiserad delning (t.ex. i finansiärsrapporter) kräver att identifierande uppgifter tagits bort och att enskilda startups inte kan härledas ur materialet.</p>
        </SubSection>

        <SubSection title="4.3 Finansiärsrapportering">
          <p>Data som används i rapporter till finansiärer (Vinnova, Region Skåne m.fl.) ska:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Innehålla enbart data som startupteamet samtyckt till att dela med finansiären</li>
            <li>Tydligt ange att data är insamlad inom ramen för coachingprogrammet</li>
            <li>Inte innehålla fullständiga transkriptioner eller interna coachnoteringar</li>
          </ul>
        </SubSection>
      </Section>

      <Section title="§ 5 Vad händer om data läcker">
        <p>Trots alla tekniska och organisatoriska åtgärder kan säkerhetsincidenter inte uteslutas. Nedan beskrivs ansvar och process vid dataintrång eller otillåtet utlämnande.</p>

        <SubSection title="5.1 Ansvarsfördelning">
          <p><strong>OpenX Lab AB ansvarar för:</strong></p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Säkerhetsproblem i plattformens kod, infrastruktur eller externa tjänsteintegrationer</li>
            <li>Incidenter som uppstår i Hetzners infrastruktur (rapporteras av Hetzner inom 24h per deras DPA)</li>
            <li>Att omedelbart informera Licenstagaren om kända eller misstänkta intrång</li>
          </ul>
          <p className="mt-2"><strong>Licenstagaren ansvarar för:</strong></p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Intrång som orsakats av svaga lösenord, delad inloggning eller obehörig intern åtkomst</li>
            <li>Otillåtet vidarebefordrande av data av coacher eller administratörer</li>
            <li>Att informera berörda registrerade och Integritetsskyddsmyndigheten (IMY)</li>
          </ul>
        </SubSection>

        <SubSection title="5.2 Incidentprocess — tidslinjer">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-xs">
              <thead>
                <tr>
                  <Th>Tidpunkt</Th>
                  <Th>Åtgärd</Th>
                  <Th>Ansvarig</Th>
                </tr>
              </thead>
              <tbody>
                {[
                  ["0–4 timmar", "Incident identifieras och isoleras. Berörda system spärras vid behov.", "OpenX Lab AB"],
                  ["0–24 timmar", "Licenstagaren informeras om incident, berörd data och preliminär bedömning.", "OpenX Lab AB"],
                  ["24–48 timmar", "Fullständig incidentrapport med: typ av data, antal berörda, sannolik orsak, vidtagna åtgärder.", "OpenX Lab AB"],
                  ["Inom 72 timmar", "Anmälan till IMY om personuppgifter berörs (GDPR Art. 33). Licenstagaren ansvarar för att göra anmälan.", "Licenstagaren (stöds av OpenX Lab AB)"],
                  ["Vid behov", "Information till berörda registrerade om risken är hög (GDPR Art. 34).", "Licenstagaren"],
                  ["30 dagar", "Slutrapport med Root Cause Analysis och förebyggande åtgärder.", "OpenX Lab AB"],
                ].map((row) => (
                  <tr key={row[0]}>
                    {row.map((cell, i) => <Td key={i}>{cell}</Td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SubSection>

        <SubSection title="5.3 Ansvarsbegränsning">
          <p>OpenX Lab AB ansvarar inte för:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Skada som uppstår till följd av Licenstagarens egna bristfälliga säkerhetsrutiner</li>
            <li>Intrång i system utanför OpenX Lab ABs kontroll (t.ex. Licenstagarens egna IT-system)</li>
            <li>Force majeure-händelser, inklusive statliga aktörers intrång</li>
          </ul>
          <p className="mt-2">OpenX Lab AB:s sammanlagda ansvar för en incident är begränsat till det belopp Licenstagaren betalat i licensavgifter de senaste tolv månaderna, om inte grov oaktsamhet eller uppsåt kan påvisas.</p>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-2">
            <p className="font-semibold text-blue-900 text-xs mb-1">Viktigt om "trots allt"</p>
            <p className="text-blue-800 text-xs">Vi har implementerat branschledande tekniska skydd: AES-256-GCM-kryptering av känslig data, SSE-C för filer, TOTP-autentisering, isolerad datamiljö per organisation och GDPR-compliant infrastruktur. Om data ändå komprometteras har vi en tydlig process för att minimera skadan och uppfylla våra rättsliga skyldigheter. Inget system kan garantera 100% säkerhet — men vi kan garantera att vi gör allt som är tekniskt och organisatoriskt rimligt, och att vi agerar omedelbart om något händer.</p>
          </div>
        </SubSection>
      </Section>

      <Section title="§ 6 Export och avtalets upphörande">
        <p>Vid uppsagd licens gäller:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>OpenX Lab AB erbjuder Licenstagaren en exportperiod på 30 dagar under vilken all data kan exporteras i JSON- och PDF-format.</li>
          <li>Efter exportperiodens slut raderas all Licenstagarens data från produktionssystemen inom 30 dagar.</li>
          <li>Anonymiserade, icke identifierbara aggregatdata kan bevaras av OpenX Lab AB för systemprestanda-historik.</li>
          <li>Tekniska loggar bevaras i 90 dagar av säkerhetsskäl och raderas därefter.</li>
        </ul>
      </Section>

      <Section title="§ 7 Underbiträden">
        <p>OpenX Lab AB anlitar följande underbiträden för behandling av Licenstagarens data:</p>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-xs">
            <thead>
              <tr>
                <Th>Tjänst</Th>
                <Th>Leverantör</Th>
                <Th>Land</Th>
                <Th>Ändamål</Th>
                <Th>DPA/certifiering</Th>
              </tr>
            </thead>
            <tbody>
              {[
                ["Serverinfrastruktur", "Hetzner Online GmbH", "Tyskland (EU)", "Drift av applikation och databas", "DPA tecknat 2026-05-26, ISO 27001"],
                ["Fillagring", "Hetzner Online GmbH", "EU-region", "Lagring av uppladdade filer (SSE-C)", "Samma DPA"],
                ["Transkription", "Klang.ai", "Sverige/Frankrike (EU)", "Transkription av möten", "ISO 27001, ISO 42001, GDPR"],
                ["AI-analys", "Mistral AI", "Frankrike (EU)", "Generering av todos, summor, nyckelord", "DPA genom företags-abonnemang"],
              ].map((row) => (
                <tr key={row[0]}>
                  {row.map((cell, i) => <Td key={i}>{cell}</Td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3">Ingen behandling sker utanför EU/EES vid val av EU-serverlokation. OpenX Lab AB informerar Licenstagaren vid byte eller tillägg av underbiträden med minst 14 dagars varsel.</p>
      </Section>

      <Section title="§ 8 Tillämplig lag och tvistlösning">
        <p>Svensk rätt tillämpas. Tvister avgörs av allmän domstol med Stockholms tingsrätt som första instans, om inte tvingande lag föreskriver annat. Vid konflikt mellan detta avtal och GDPR har GDPR företräde.</p>
      </Section>

      <Section title="§ 9 Underskrifter">
        <div className="grid grid-cols-2 gap-6">
          <div className="border border-gray-200 rounded-lg p-4">
            <p className="font-semibold text-xs text-gray-600 mb-3">OpenX Lab AB (Controller)</p>
            <p className="text-xs text-gray-500 mb-1">2026-05-29</p>
            <p className="text-xs text-gray-500 mb-1">Pontus Rystedt</p>
            <p className="text-xs text-gray-500 mb-1">OpenX Lab AB</p>
            <p className="text-xs text-gray-500">Produktansvarig StartupCoach</p>
          </div>
          <div className="border border-dashed border-gray-300 rounded-lg p-4">
            <p className="font-semibold text-xs text-gray-600 mb-3">Licenstagaren (Processor)</p>
            <p className="text-xs text-gray-400 mb-1">Datum:</p>
            <p className="text-xs text-gray-400 mb-1">Namn:</p>
            <p className="text-xs text-gray-400">Titel:</p>
          </div>
        </div>
      </Section>
    </div>
  )
}

function TSA() {
  return (
    <div>
      <div className="mb-8 p-5 rounded-xl bg-[#1A1A2E] text-white">
        <h1 className="text-xl font-semibold mb-1">TEKNISK SÄKERHETSARKITEKTUR</h1>
        <p className="text-[#AAAACC] text-sm">OpenX Lab Startupcoach</p>
        <p className="text-[#AAAACC] text-sm mt-1">Principer, design och implementering · Version 1.0 · Maj 2026</p>
      </div>

      <Section title="Kapitel 1 — Principer vi byggde systemet efter">
        <p>Det här kapitlet förklarar de grundläggande valen vi gjort för att bygga ett system som kan förvaras affärshemligheter i. Det är skrivet för att vara förståeligt utan teknisk bakgrund.</p>

        <SubSection title="1.1 Ni äger er data — vi förvaltar den">
          <p>Det viktigaste valet vi gjort är att all kunddata är isolerad per organisation. Det är inte en inställning i ett system — det är en arkitekturprincip inbyggd i databasen. En coaches session i Stockholm kan aldrig synas för en coach i Göteborg, även om de använder exakt samma plattform.</p>
          <p>Tekniskt innebär det att varje databasfråga obligatoriskt filtrerar på organisationsidentifierare. Det är omöjligt att "glömma" filtret — systemet kräver det.</p>
        </SubSection>

        <SubSection title="1.2 Kryptering som grundläggande skikt, inte tillägg">
          <p>Vi valde att kryptera känsliga data redan i applikationen, inte enbart förlita oss på att servern är säker. Det betyder att om någon fick fysisk tillgång till databasen eller servern, ser de bara krypterat brus.</p>
          <p>Konkret innebär det att transkriptioner, mötessummor och TOTP-hemligheter krypteras med AES-256-GCM direkt i vår kod, med en nyckel som aldrig lagras i databasen. Filer krypteras med er krypteringsnyckel (SSE-C) — Hetzner lagrar aldrig nyckeln och kan inte läsa filerna.</p>
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
            <p className="font-semibold text-xs mb-1">Vad detta betyder i praktiken</p>
            <p className="text-xs">Om Hetzner drabbas av ett intrång ser angriparen enbart krypterad data utan nycklar. Om vår databas exponeras är transkriptioner oläsliga. Det är djupförsvar — flera oberoende skyddslager.</p>
          </div>
        </SubSection>

        <SubSection title="1.3 Europeiska leverantörer utan Cloud Act-exponering">
          <p>Vi valde medvetet att enbart använda europeiska underleverantörer: Hetzner (tysk infrastruktur), Klang.ai (svensk transkription, servrar i Frankrike), Mistral AI (franskt bolag, EU-infrastruktur).</p>
          <p>Cloud Act är en amerikansk lag som tillåter amerikanska myndigheter att begära ut data från amerikanska bolag — oavsett om servern är i EU. Genom att välja europeiska bolag utan amerikanskt ägarskap eliminerar vi den risken.</p>
        </SubSection>

        <SubSection title="1.4 Agenter läser text, inte filer">
          <p>En princip som är ovanlig men viktig: AI-agenterna i systemet läser aldrig filer direkt från lagringen. När en fil laddas upp extraheras texten och lagras i databasen. Agenterna söker och läser text ur databasen.</p>
          <p>Resultatet är att fillagringen enbart hanterar binärdata. Agenterna arbetar mot databasen. De två systemen är oberoende, vilket gör det enkelt att byta fillagring utan att påverka AI-funktionaliteten.</p>
        </SubSection>

        <SubSection title="1.5 Migrationsberedskap — ingen leverantörsinlåsning">
          <p>Systemet är byggt för att kunna migrera till ny infrastruktur utan kodändringar. Fillagringen använder ett S3-kompatibelt API, databasen är standard PostgreSQL, applikationen körs i Docker. Det enda som behöver ändras vid migration är konfigurationsvärden.</p>
          <p>Cleura Cloud — en svensk molnleverantör utan amerikanska ägarintressen — är förberedd som migrationsmål. Det kräver byte av tre miljövariabler och en pg_dump/pg_restore-operation.</p>
        </SubSection>

        <SubSection title="1.6 Systemet gör aldrig autonoma beslut om människor">
          <p>AI-agenterna i Startupcoach ger förslag och sammanfattningar, men fattar aldrig beslut som påverkar registrerade. Coach godkänner alltid IRL-uppdateringar, screening-rekommendationer och systemförändringar. Det uppfyller GDPR artikel 22 om automatiserade beslut och bygger tillit hos entreprenörerna.</p>
        </SubSection>
      </Section>

      <Section title="Kapitel 2 — Systemöversikt och teknikstack">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-xs">
            <thead>
              <tr>
                <Th>Komponent</Th>
                <Th>Teknik</Th>
                <Th>Leverantör/plats</Th>
                <Th>Syfte</Th>
              </tr>
            </thead>
            <tbody>
              {[
                ["Applikation", "Next.js 16, TypeScript", "Coolify / Hetzner (EU)", "Webbgränssnitt och API"],
                ["Databas", "PostgreSQL via Prisma 7", "Nhost EU / Hetzner (EU)", "All strukturerad data"],
                ["Fillagring", "S3-kompatibelt API", "Hetzner Object Storage (EU)", "Dokument och uppladdade filer"],
                ["Transkription", "Klang.ai API + webhook", "Klang.ai (servrar i Frankrike)", "Mötestranskription"],
                ["AI-analys", "Mistral API", "Mistral AI (Frankrike, EU)", "Todos, summor, nyckelord"],
                ["Autentisering", "NextAuth v5 + TOTP", "Självhostat", "Inloggning och sessioner"],
                ["Deployment", "Docker / Coolify 4.x", "Hetzner CAX11 (ARM)", "Kontaineriserad drift"],
              ].map((row) => (
                <tr key={row[0]}>
                  {row.map((cell, i) => <Td key={i}>{cell}</Td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <SubSection title="2.1 Dataisoleringsmodell">
          <p>Varje organisation (licenstagare) har sin egna datamiljö. Isoleringen implementeras på tre nivåer:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Databasnivå:</strong> varje tabell har ett orgId-fält. Alla Prisma-queries filtrar obligatoriskt på detta.</li>
            <li><strong>API-nivå:</strong> varje route hämtar orgId från sessionstoken och injicerar det i databasfrågan.</li>
            <li><strong>Sessionsnivå:</strong> JWT-token innehåller roll, orgId och startupId. Middleware validerar dessa vid varje anrop.</li>
          </ul>
        </SubSection>

        <SubSection title="2.2 Rollhierarki">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-xs">
              <thead>
                <tr>
                  <Th>Roll</Th>
                  <Th>Åtkomst</Th>
                  <Th>Skapad av</Th>
                </tr>
              </thead>
              <tbody>
                {[
                  ["SYSTEM_ADMIN", "Alla organisationer — teknisk administration (OpenX Lab)", "OpenX Lab AB"],
                  ["CLIENT_ADMIN", "Alla coaches och startups inom sin organisation", "OpenX Lab AB vid onboarding"],
                  ["COACH", "Alla startups inom sin organisation", "ClientAdmin"],
                  ["ENTREPRENEUR", "Enbart egna startups — begränsad vy", "Coach eller Entrepreneur"],
                ].map((row) => (
                  <tr key={row[0]}>
                    {row.map((cell, i) => <Td key={i}>{cell}</Td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SubSection>
      </Section>

      <Section title="Kapitel 3 — Krypteringsarkitektur">
        <SubSection title="3.1 Data i transit">
          <p>All kommunikation skyddas av TLS 1.2 eller nyare. TLS 1.3 används där möjligt. Hetzner stödjer TLS_AES_256_GCM_SHA384 och TLS_CHACHA20_POLY1305_SHA256.</p>
        </SubSection>

        <SubSection title="3.2 Data i vila — databas">
          <p>Känsliga datafält krypteras med AES-256-GCM direkt i applikationskoden, innan data skrivs till databasen. Metoden ger autenticerad kryptering — om data manipuleras, detekteras det.</p>
          <div className="overflow-x-auto mt-2">
            <table className="w-full border-collapse text-xs">
              <thead>
                <tr>
                  <Th>Datafält</Th>
                  <Th>Krypteringsmetod</Th>
                  <Th>Nyckellagring</Th>
                </tr>
              </thead>
              <tbody>
                {[
                  ["Transkriptioner (mötestext)", "AES-256-GCM, unik IV per post", "Miljövariabel ENCRYPTION_KEY"],
                  ["Sessionssummor", "AES-256-GCM, unik IV per post", "Miljövariabel ENCRYPTION_KEY"],
                  ["TOTP-hemligheter (2FA-koder)", "AES-256-GCM + JSON-lagring", "Miljövariabel ENCRYPTION_KEY"],
                  ["Lösenord", "bcrypt med individuellt salt", "Lagras aldrig i klartext"],
                  ["Klang API-nycklar", "AES-256-GCM", "Miljövariabel ENCRYPTION_KEY"],
                  ["Övriga datafält", "Lagras i klartext (ej känsliga)", "Ej tillämpbart"],
                ].map((row) => (
                  <tr key={row[0]}>
                    {row.map((cell, i) => <Td key={i}>{cell}</Td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-2">ENCRYPTION_KEY är en 32-byte slumpmässig nyckel genererad med kryptografisk PRNG. Den lagras i produktionsmiljön som en miljövariabel i Coolify och skrivs aldrig till versionskontroll.</p>
        </SubSection>

        <SubSection title="3.3 Data i vila — fillagring (SSE-C)">
          <p>Filer lagras i Hetzner Object Storage med Server-Side Encryption with Customer-provided keys (SSE-C). Processen:</p>
          <ol className="list-decimal pl-5 space-y-1">
            <li>Ni (OpenX Lab) genererar en 32-byte krypteringsnyckel (FILE_ENCRYPTION_KEY).</li>
            <li>Vid varje uppladdning skickas nyckeln i request-headern. Hetzner krypterar filen och lagrar sedan inte nyckeln.</li>
            <li>Vid nedladdning måste nyckeln skickas med — Hetzner kan inte dekryptera utan den.</li>
          </ol>
          <p className="mt-2">Resultatet: Hetzner kan aldrig läsa era filer, ens med full datacentertillgång.</p>
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 mt-2">
            <p className="font-semibold text-xs mb-1">SSE-C kontra standard S3-kryptering</p>
            <p className="text-xs">Standard S3-kryptering (SSE-S3) krypterar filer med Hetzners egna nycklar. Det skyddar mot fysisk stöld av hårddiskar men inte mot intrång i Hetzners system. SSE-C ger er full kontroll — nyckeln lämnar aldrig er miljö.</p>
          </div>
        </SubSection>

        <SubSection title="3.4 Nyckelrotation">
          <p>En plan för nyckelrotation bör implementeras vid behov (t.ex. vid misstanke om kompromiss):</p>
          <ol className="list-decimal pl-5 space-y-1">
            <li>Generera ny ENCRYPTION_KEY</li>
            <li>Kör migrationsscript: läs alla krypterade poster, dekryptera med gammal nyckel, kryptera med ny nyckel, skriv tillbaka</li>
            <li>För SSE-C: ladda ner och ladda upp om filer med ny FILE_ENCRYPTION_KEY (copy-replace)</li>
            <li>Uppdatera miljövariabeln i Coolify</li>
          </ol>
          <p className="mt-2">Rotation kräver underhållsfönster på uppskattningsvis 30–60 minuter beroende på datamängd.</p>
        </SubSection>
      </Section>

      <Section title="Kapitel 4 — Autentisering och sessionshantering">
        <SubSection title="4.1 Inloggningsflöde med TOTP">
          <p>Startupcoach använder ett tvåstegs-autentiseringsflöde:</p>
          <ol className="list-decimal pl-5 space-y-1">
            <li><strong>Steg 1:</strong> E-post + lösenord (bcrypt-verifiering server-side)</li>
            <li><strong>Steg 2:</strong> 6-siffrig TOTP-kod från Authenticator-app (Google Authenticator, Authy m.fl.)</li>
          </ol>
          <p className="mt-2">TOTP-hemligheten är krypterad med AES-256-GCM i databasen. Middleware kontrollerar vid varje sidladdning att TOTP är verifierat i sessionen — inte bara vid inloggning.</p>
        </SubSection>

        <SubSection title="4.2 Sessionsskydd">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-xs">
              <thead>
                <tr>
                  <Th>Mekanism</Th>
                  <Th>Implementation</Th>
                </tr>
              </thead>
              <tbody>
                {[
                  ["Sessionstoken", "JWT signerat med AUTH_SECRET (256-bit slumpmässig nyckel)"],
                  ["Validering", "Server-side vid varje API-anrop — klientvalidering räcker aldrig"],
                  ["Innehåll", "userId, role, orgId, startupId, totpVerified"],
                  ["Inaktiva konton", "isActive=false blockerar inloggning i authorize()-funktionen"],
                  ["TOTP-reset", "totpVerified=false vid ny session — kräver ny TOTP-verifiering"],
                ].map((row) => (
                  <tr key={row[0]}>
                    {row.map((cell, i) => <Td key={i}>{cell}</Td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SubSection>
      </Section>

      <Section title="Kapitel 5 — Externa tjänster — dataflöden och garantier">
        <SubSection title="5.1 Klang.ai — transkription">
          <p>Klang.ai tar emot ljud från möten, transkriberar och levererar text via webhook.</p>
          <div className="overflow-x-auto mt-2">
            <table className="w-full border-collapse text-xs">
              <tbody>
                {[
                  ["Dataflöde", "Ljud skickas vid möte → Klang transkriberar → webhook till Startupcoach → krypteras omedelbart"],
                  ["Datalagringstid hos Klang", "Enligt Klang.ai raderas data när det raderas i systemet, inklusive backuper"],
                  ["Träning på kunddata", "Aldrig — explicit policy, ISO 42001-certifierat"],
                  ["Serverplats", "Frankrike (Scaleway — europeisk molnleverantör)"],
                  ["GDPR-garanti", "ISO 27001, ISO 42001, EU AI Act-compliant, DPA tillgängligt"],
                  ["Cloud Act-risk", "Ingen — europeiskt bolag utan US-ägarskap"],
                  ["Webhook-säkerhet", "Verifieras med hemlig signatur (KLANG_WEBHOOK_SECRET) vid varje anrop"],
                ].map((row) => (
                  <tr key={row[0]}>
                    <Th>{row[0]}</Th>
                    <Td>{row[1]}</Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SubSection>

        <SubSection title="5.2 Mistral AI — AI-analys">
          <p>Mistral tar emot text (transkriptioner, filinnehåll) och returnerar strukturerad output (todos, summor, nyckelord).</p>
          <div className="overflow-x-auto mt-2">
            <table className="w-full border-collapse text-xs">
              <tbody>
                {[
                  ["Dataflöde", "Text skickas server-side till Mistral API → svar returneras → sparas i krypterad databas"],
                  ["Exponering", "Data skickas aldrig direkt från klientens webbläsare — alltid via vår server"],
                  ["Träning på kunddata", "Nej — API-kunder är opt-out som standard per Mistrals policy. StartupCoach säkerställer att opt-out är valt."],
                  ["Loggar hos Mistral", "API-loggar bevaras 30 dagar för drift — används ej för träning"],
                  ["Serverplats", "EU-baserade datacenter. Egen infrastruktur sedan juni 2025 (18 000 NVIDIA-chips, Frankrike)"],
                  ["Cloud Act-risk", "Ingen — franskt bolag utan US-ägarskap"],
                  ["DPA", "Tillgängligt för API-kunder — rekommenderas att Licenstagaren tecknar eget"],
                  ["Kontextavgränsning", "Varje API-anrop är isolerat till en session — ingen korsreferens mellan startups"],
                ].map((row) => (
                  <tr key={row[0]}>
                    <Th>{row[0]}</Th>
                    <Td>{row[1]}</Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SubSection>

        <SubSection title="5.3 Hetzner Online GmbH — infrastruktur">
          <p>Hetzner driver servern (CAX11 ARM i Europa) och objektlagringen. DPA är tecknat (version 1.2, 26 maj 2026) med OpenX Lab AB som Controller.</p>
          <div className="overflow-x-auto mt-2">
            <table className="w-full border-collapse text-xs">
              <thead>
                <tr>
                  <Th>Certifiering</Th>
                  <Th>Detalj</Th>
                </tr>
              </thead>
              <tbody>
                {[
                  ["ISO 27001", "Informationssäkerhetshantering"],
                  ["BSI-KritisV § 8a", "Kritisk infrastruktur-säkerhet (tyskt standardverk)"],
                  ["BSI C5 Type 2", "Cloud-säkerhet, oberoende granskat"],
                  ["EMAS / ISO 14001", "Miljöledningssystem (tyska datacenter)"],
                  ["TOMs-granskning", "Oberoende extern granskning minst en gång per år"],
                  ["Incidentrapportering", "Rapporterar dataintrång utan dröjsmål per DPA §5.8"],
                ].map((row) => (
                  <tr key={row[0]}>
                    {row.map((cell, i) => <Td key={i}>{cell}</Td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mt-2">
            <p className="text-amber-900 text-xs"><strong>Viktigt:</strong> Encryption at rest för Cloud servers och Object Storage är klientens ansvar per Hetzners TOM. Vi har löst detta med AES-256-GCM i applikationen och SSE-C för filer.</p>
          </div>
        </SubSection>
      </Section>

      <Section title="Kapitel 6 — Tekniska säkerhetsåtgärder">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-xs">
            <thead>
              <tr>
                <Th>Åtgärd</Th>
                <Th>Implementation</Th>
                <Th>Skyddar mot</Th>
              </tr>
            </thead>
            <tbody>
              {[
                ["RBAC", "Rollbaserad åtkomstkontroll, server-side validering", "Obehörig dataåtkomst"],
                ["Org-isolering", "orgId obligatoriskt i alla databasfrågor", "Datakorsläckage mellan kunder"],
                ["SQL-injektion", "Prisma ORM med parameteriserade queries", "SQL-injektion"],
                ["XSS", "Next.js server-components, Content Security Policy", "Cross-site scripting"],
                ["Webhook-verifiering", "HMAC-signatur på alla inkommande webhooks", "Förfalskade webhook-anrop"],
                ["Filvalidering", "MIME-typkontroll, 20 MB-gräns, inga körbara filer", "Skadliga filuppladdningar"],
                ["Felmeddelanden", "Generiska felmeddelanden till klient — detaljer i serverlogg", "Informationsläckage"],
                ["Hemligheter", "Aldrig i kod eller versionskontroll — alltid miljövariabler", "Exponerade nycklar"],
                ["Backuper", "Automatiska dagliga snapshots, krypterade", "Dataförlust"],
                ["Rate limiting", "Skydd mot brute force på inloggning och API", "Automatiserade attacker"],
              ].map((row) => (
                <tr key={row[0]}>
                  {row.map((cell, i) => <Td key={i}>{cell}</Td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <Section title="Kapitel 7 — Migrationsberedskap till Cleura Cloud">
        <p>Cleura är en svensk molnleverantör byggd på OpenStack, under svensk och europeisk jurisdiktion. Migrationen kan genomföras utan kodändringar.</p>
        <div className="overflow-x-auto mt-2">
          <table className="w-full border-collapse text-xs">
            <thead>
              <tr>
                <Th>Komponent</Th>
                <Th>Migrationssteg</Th>
                <Th>Nedtid</Th>
              </tr>
            </thead>
            <tbody>
              {[
                ["Applikation (Docker)", "Starta Coolify på Cleura VM. Deploya samma Docker-image.", "Noll (blue-green)"],
                ["Databas (PostgreSQL)", "pg_dump på Hetzner → pg_restore på Cleura managed PostgreSQL", "< 30 min"],
                ["Fillagring", "Byt HETZNER_S3_ENDPOINT till Cleura S3-endpoint. Synkronisera bucket med rclone.", "< 60 min"],
                ["SSL-certifikat", "Lets Encrypt via Coolify — automatisk omleverans", "Noll"],
                ["DNS", "Peka startupcoach.openxlab.se mot ny server-IP", "< 5 min TTL-propagering"],
                ["Total estimerad nedtid", "Under 1 timme vid planerat underhållsfönster", "—"],
              ].map((row) => (
                <tr key={row[0]}>
                  {row.map((cell, i) => <Td key={i}>{cell}</Td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3">Cleura-specifika fördelar: Barbican-tjänst för hårdvarubaserad nyckelförvaring (HSM-liknande). Ger ytterligare ett säkerhetslager för ENCRYPTION_KEY och FILE_ENCRYPTION_KEY. Rekommenderas vid migration.</p>
      </Section>
    </div>
  )
}

export default function SecurityPage() {
  const [tab, setTab] = useState<"pba" | "tsa">("pba")

  return (
    <div className="max-w-4xl">
      <div className="flex gap-1 mb-6 border-b border-gray-200">
        {([
          ["pba", "Personuppgiftsbiträdesavtal"],
          ["tsa", "Teknisk Säkerhetsarkitektur"],
        ] as const).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              tab === key
                ? "border-[#1D9E75] text-[#1D9E75]"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "pba" ? <PBA /> : <TSA />}
    </div>
  )
}
