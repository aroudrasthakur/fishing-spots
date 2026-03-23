export function LegalFooter() {
  return (
    <footer className="border-t border-zinc-200/90 bg-white/70 px-4 py-5 text-xs leading-relaxed text-zinc-600 backdrop-blur-sm dark:border-zinc-800/80 dark:bg-zinc-950/80 dark:text-zinc-400">
      <div className="mx-auto flex max-w-4xl flex-col gap-3">
        <p>
          <strong className="text-zinc-800 dark:text-zinc-200">Regulations:</strong> Fishing
          rules, licenses, seasons, and access vary by state and waterbody. Confirm with your{" "}
          <a
            href="https://www.fishwildlife.org/afwa-in-action/north-american-wildlife-natural-resources-management-list-of-member-agencies"
            className="text-emerald-800 underline hover:text-emerald-900 dark:text-emerald-400"
            target="_blank"
            rel="noopener noreferrer"
          >
            state fish &amp; wildlife agency
          </a>{" "}
          (and federal rules in national parks, refuges, or federal waters—see{" "}
          <a
            href="https://www.fisheries.noaa.gov/recreational-fishing"
            className="text-emerald-800 underline hover:text-emerald-900 dark:text-emerald-400"
            target="_blank"
            rel="noopener noreferrer"
          >
            NOAA Fisheries
          </a>{" "}
          where applicable).
        </p>
        <p>
          <strong className="text-zinc-800 dark:text-zinc-200">Disclaimer:</strong> Map pins,
          catch photos, and descriptions are community or demo information, not legal or safety
          advice. Confirm access, seasons, bag limits, and licensing before fishing.
        </p>
        <p>
          <strong className="text-zinc-800 dark:text-zinc-200">Data attribution:</strong> Basemap ©{" "}
          <a
            href="https://www.openstreetmap.org/copyright"
            className="underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            OpenStreetMap
          </a>{" "}
          contributors, ©{" "}
          <a
            href="https://carto.com/attributions"
            className="underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            CARTO
          </a>
          . Lake and river overlays are derived from{" "}
          <a
            href="https://www.naturalearthdata.com/"
            className="underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            Natural Earth
          </a>{" "}
          (public domain), clipped to an approximate U.S. bounding box (50m resolution). For
          production consider USGS NHD and authoritative boundaries.
        </p>
      </div>
    </footer>
  );
}
