#!/bin/bash

# Script per applicare fix globali a tutti i file HTML
# GLOBAL FIX APPLICATOR - SWARM AGENT 3

echo "🔧 GLOBAL FIX APPLICATOR - Inizio applicazione fix..."

# Contatore dei file processati
count=0

# File pattern da elaborare
files_to_process=(
  "/Users/andreapanzeri/progetti/IT-ERA/settori/*.html"
  "/Users/andreapanzeri/progetti/IT-ERA/landing/*.html"
  "/Users/andreapanzeri/progetti/IT-ERA/servizi-it/*.html"
)

# CSS fix da aggiungere nel head
css_fix='
<!-- Mobile Menu Fix CSS -->
<link rel="stylesheet" href="/css/mobile-menu-fix.css">

<!-- Performance Critical CSS -->
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: system-ui, -apple-system, sans-serif; }
  .hero { min-height: 50vh; }
  @media (max-width: 768px) {
    .mobile-menu-toggle { display: block !important; }
  }
</style>

<!-- Preconnect -->
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="dns-prefetch" href="https://www.google-analytics.com">
'

# Script mobile menu da aggiungere prima di </body>
mobile_script='
<!-- Mobile Menu Emergency Handler -->
<script>
(function() {
  document.addEventListener("DOMContentLoaded", function() {
    var btn = document.querySelector(".mobile-menu-toggle, .hamburger-menu");
    var nav = document.querySelector(".mobile-nav, .mobile-menu");
    if (btn && nav) {
      btn.addEventListener("click", function(e) {
        e.preventDefault();
        nav.classList.toggle("active");
        this.classList.toggle("active");
        this.setAttribute("aria-expanded",
          this.classList.contains("active") ? "true" : "false");
      });
    }
  });
})();
</script>'

# Funzione per processare un singolo file
process_file() {
  local file=$1
  echo "📝 Processando: $file"

  # Backup del file originale
  cp "$file" "${file}.backup"

  # Applica fix nel head (prima di </head>)
  if grep -q "</head>" "$file"; then
    sed -i.tmp "/</head>/i\\
$css_fix
" "$file"
    rm "${file}.tmp"
    ((count++))
  fi

  # Applica script mobile menu (prima di </body>)
  if grep -q "</body>" "$file"; then
    sed -i.tmp "/</body>/i\\
$mobile_script
" "$file"
    rm "${file}.tmp"
  fi

  # Sostituisci loading="lazy" con loading="eager" nelle prime immagini
  sed -i.tmp 's/loading="lazy"/loading="eager"/1' "$file"
  rm "${file}.tmp"
}

# Processa tutti i file
for pattern in "${files_to_process[@]}"; do
  for file in $pattern; do
    if [[ -f "$file" ]]; then
      process_file "$file"
    fi
  done
done

echo "✅ Fix applicati a $count file HTML"
echo "📋 Riepilogo operazioni:"
echo "   - Mobile Menu CSS aggiunto"
echo "   - Performance Critical CSS aggiunto"
echo "   - Preconnect links aggiunti"
echo "   - Mobile Menu Emergency Handler aggiunto"
echo "   - Prima immagine lazy → eager"
echo ""
echo "🔍 File processati nei seguenti pattern:"
for pattern in "${files_to_process[@]}"; do
  echo "   - $pattern"
done