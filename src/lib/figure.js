// The Warlock silhouette drawn behind the paperdoll (from the Blazing Scream Codex).
export const FIGURE = `<svg viewBox="0 0 240 400">
<defs>
<radialGradient id="fig-glow" cx=".5" cy=".46" r=".5"><stop offset="0" stop-color="#f0683a" stop-opacity=".42"/><stop offset=".55" stop-color="#8a2a10" stop-opacity=".16"/><stop offset="1" stop-color="#8a2a10" stop-opacity="0"/></radialGradient>
<linearGradient id="fig-body" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2d1f1a"/><stop offset=".6" stop-color="#140d0b"/><stop offset="1" stop-color="#070505"/></linearGradient>
<linearGradient id="fig-lining" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ff9a4a" stop-opacity="0"/><stop offset="1" stop-color="#f0683a" stop-opacity=".55"/></linearGradient>
<linearGradient id="fig-blade" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#d9d2cc"/><stop offset=".6" stop-color="#7b6e6a"/><stop offset="1" stop-color="#b8263a"/></linearGradient>
<radialGradient id="fig-orb" cx=".45" cy=".4" r=".6"><stop offset="0" stop-color="#fff3c4"/><stop offset=".35" stop-color="#ffa040"/><stop offset=".8" stop-color="#b2280e"/><stop offset="1" stop-color="#4a0d04"/></radialGradient>
<filter id="fig-blur" x="-1" y="-1" width="3" height="3"><feGaussianBlur stdDeviation="3"/></filter>
</defs>
<ellipse cx="120" cy="196" rx="120" ry="196" fill="url(#fig-glow)"/>
<g fill="none" stroke="#f0683a" stroke-opacity=".5">
<ellipse cx="120" cy="372" rx="104" ry="21"/>
<ellipse cx="120" cy="372" rx="80" ry="15" stroke-dasharray="3 4"/>
<path d="M120 357 L165.9 384.1 L45.8 367.4 L194.2 367.4 L74.1 384.1 Z" stroke-opacity=".38"/>
</g>
<g fill="url(#fig-body)" stroke="#f0683a" stroke-opacity=".55" stroke-width="1.2" stroke-linejoin="round">
<path d="M100 58 Q84 38 82 14 Q94 34 108 50 Z M140 58 Q156 38 158 14 Q146 34 132 50 Z"/>
<path d="M88 140 L152 140 L160 220 L178 360 L164 352 L156 364 L142 354 L132 366 L120 356 L108 366 L98 354 L84 364 L76 352 L62 360 L80 220 Z"/>
<path d="M70 146 L58 214 L70 220 L88 152 Z M152 146 L180 198 L170 206 L146 156 Z"/>
<path d="M70 132 Q84 108 120 110 Q156 108 170 132 L178 150 Q160 140 148 142 L92 142 Q80 140 62 150 Z"/>
<path d="M74 126 L54 98 L86 118 Z M166 126 L186 98 L154 118 Z"/>
<path d="M120 40 C98 40 90 60 92 82 C93 98 100 110 108 118 L132 118 C140 110 147 98 148 82 C150 60 142 40 120 40 Z"/>
</g>
<path d="M120 224 L111 356 L129 356 Z" fill="url(#fig-lining)"/>
<path d="M83 211 L157 211 L158 221 L82 221 Z" fill="#3a2418" stroke="#000" stroke-opacity=".6"/>
<path d="M120 211 L125 216 L120 221 L115 216 Z" fill="#d49a48"/>
<ellipse cx="120" cy="88" rx="13" ry="17" fill="#050304"/>
<g fill="#ff8a3d"><ellipse cx="114" cy="86" rx="3.2" ry="1.6"/><ellipse cx="126" cy="86" rx="3.2" ry="1.6"/></g>
<g fill="#ff8a3d" filter="url(#fig-blur)" opacity=".8"><ellipse cx="114" cy="86" rx="4" ry="2.5"/><ellipse cx="126" cy="86" rx="4" ry="2.5"/></g>
<path d="M59 230 L65 230 L63.5 340 L62 350 L60.5 340 Z" fill="url(#fig-blade)" stroke="#000" stroke-opacity=".5"/>
<path d="M49 225 L75 225 L75 230 L49 230 Z M60 208 L64 208 L64 225 L60 225 Z" fill="#4a3424" stroke="#000" stroke-opacity=".6"/>
<circle cx="62" cy="205" r="3.5" fill="#b8263a"/>
<circle cx="62" cy="217" r="6" fill="url(#fig-body)" stroke="#f0683a" stroke-opacity=".55"/>
<circle cx="182" cy="214" r="26" fill="#f0683a" opacity=".35" filter="url(#fig-blur)"/>
<circle cx="182" cy="214" r="13" fill="url(#fig-orb)"/>
<circle cx="176" cy="206" r="6" fill="url(#fig-body)" stroke="#f0683a" stroke-opacity=".55"/>
</svg>`;
