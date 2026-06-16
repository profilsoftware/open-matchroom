import Link from "next/link";
import { buttonClasses } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { LogoMark } from "./LogoMark";

/**
 * Site footer rendered on every public + admin page. The admin button is a
 * real <Link> to the gated /admin route.
 */
export function Footer() {
  return (
    <footer className="mt-auto border-line border-t bg-surface px-[22px] py-[26px]">
      <div className="mx-auto flex max-w-[1180px] flex-wrap items-center gap-[18px]">
        <div className="flex items-center gap-3">
          <LogoMark size={30} />
          <div className="text-[13px] text-ink-2">
            Built &amp; open-sourced by <b className="text-ink">Profil Software</b> · a white-label
            match center you can self-host and brand.
            <br />
            <a
              className="font-bold text-brand-strong hover:underline"
              href="https://profil-software.com"
              target="_blank"
              rel="noreferrer"
            >
              profil-software.com
            </a>
          </div>
        </div>
        <div className="ml-auto flex items-center gap-4 text-[12px] text-muted">
          <a
            className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border border-[color-mix(in_srgb,var(--brand)_22%,transparent)] bg-brand-tint px-[9px] py-1 font-medium font-mono text-[11px] text-brand-strong max-[620px]:hidden"
            href="https://github.com/profilsoftware/open-matchroom"
            target="_blank"
            rel="noreferrer"
          >
            <Icon name="github" size={14} /> open source
          </a>
          <Link className={buttonClasses("ghost", true)} href="/admin">
            <Icon name="lock" size={14} /> Admin
          </Link>
        </div>
      </div>
    </footer>
  );
}
