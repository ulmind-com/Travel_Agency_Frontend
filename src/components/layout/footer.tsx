import footerBg from "@/assets/footer-landscape.png.asset.json";

export function Footer() {
  return (
    <footer className="relative m-0 block w-full bg-[#0d2b2b] p-0 text-white">
      <img
        src={footerBg.url}
        alt=""
        className="block w-full select-none"
        draggable={false}
      />
      <div className="bg-[#0d2b2b] py-4 text-center text-xs text-white/60">
        &copy; {new Date().getFullYear()} Ulmind Travel · Crafted with intention
      </div>
    </footer>
  );
}
