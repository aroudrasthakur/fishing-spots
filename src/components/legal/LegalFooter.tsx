export function LegalFooter() {
  return (
    <footer className="border-t border-zinc-200 bg-zinc-50 px-4 py-4 text-xs leading-relaxed text-zinc-600 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-400">
      <div className="mx-auto flex max-w-4xl flex-col gap-3">
        <p>
          <strong className="text-zinc-800 dark:text-zinc-200">Regulations:</strong> Fishing
          rules, licenses, and access change by waterbody. Always verify with the{" "}
          <a
            href="https://tpwd.texas.gov/"
            className="text-emerald-800 underline hover:text-emerald-900 dark:text-emerald-400"
            target="_blank"
            rel="noopener noreferrer"
          >
            Texas Parks &amp; Wildlife Department (TPWD)
          </a>{" "}
          and the{" "}
          <a
            href="https://tpwd.texas.gov/app/outdoorannual/"
            className="text-emerald-800 underline hover:text-emerald-900 dark:text-emerald-400"
            target="_blank"
            rel="noopener noreferrer"
          >
            Outdoor Annual
          </a>
          .
        </p>
        <p>
          <strong className="text-zinc-800 dark:text-zinc-200">Disclaimer:</strong> Map pins,
          catch photos, and descriptions are community or demo information, not legal or safety
          advice. Confirm access, seasons, bag limits, and licensing before fishing.
        </p>
        <p>
          <strong className="text-zinc-800 dark:text-zinc-200">Data attribution:</strong> Satellite
          and reference layers ©{" "}
          <a
            href="https://www.esri.com/en-us/legal/terms/data-attributions"
            className="underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            Esri
          </a>
          , Maxar, Earthstar Geographics, and the GIS User Community. Texas water outlines are
          derived from{" "}
          <a
            href="https://www.naturalearthdata.com/"
            className="underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            Natural Earth
          </a>{" "}
          (public domain), clipped with a US states boundary sample; for production consider USGS
          NHD and an authoritative state boundary. USGS data should be cited per their terms when
          used.
        </p>
      </div>
    </footer>
  );
}
