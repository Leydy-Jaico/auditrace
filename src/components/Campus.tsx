export default function Campus() {
  return (
    <svg
      viewBox="0 0 760 560"
      role="img"
      aria-label="Ilustración de un campus universitario luminoso con edificios, árboles y una ficha de notas"
      className="campus"
    >
      <defs>
        <linearGradient id="sky" x2="0" y2="1">
          <stop stopColor="#d5edff" />
          <stop offset="1" stopColor="#f6fbff" />
        </linearGradient>
        <linearGradient id="lawn" x2="0" y2="1">
          <stop stopColor="#d8ecb9" />
          <stop offset="1" stopColor="#acd5ac" />
        </linearGradient>
        <filter id="shadow">
          <feDropShadow
            dx="0"
            dy="12"
            stdDeviation="12"
            floodColor="#254c83"
            floodOpacity=".12"
          />
        </filter>
      </defs>
      <rect width="760" height="560" rx="32" fill="url(#sky)" />
      <circle cx="606" cy="104" r="48" fill="#fff8ce" />
      <g fill="#fff" opacity=".8">
        <ellipse cx="160" cy="105" rx="70" ry="15" />
        <ellipse cx="193" cy="92" rx="33" ry="22" />
        <ellipse cx="460" cy="71" rx="62" ry="13" />
      </g>
      <path d="M0 392Q200 344 390 386T760 372V560H0Z" fill="url(#lawn)" />
      <path d="M278 560L345 372H418L515 560Z" fill="#f6e7cc" />
      <g stroke="#cdbea9" strokeWidth="2">
        <path d="M70 221h185v190H70z" fill="#efddbf" />
        <path d="M510 216h180v195H510z" fill="#ebd6b7" />
        <path d="M236 196h293v223H236z" fill="#f9ead1" />
        <path d="M220 197L383 121 545 197Z" fill="#bbcbd6" />
        <path d="M253 190L383 143 513 190Z" fill="#eef2eb" />
      </g>
      <g fill="#9abed3" stroke="#f8edd9" strokeWidth="9">
        {[90, 139, 188, 533, 582, 631].map((x) =>
          [244, 305, 366].map((y) => (
            <rect key={x + "-" + y} x={x} y={y} width="35" height="36" rx="2" />
          )),
        )}
        {[270, 320, 420, 470].map((x) =>
          [229, 288].map((y) => (
            <rect key={x + "-" + y} x={x} y={y} width="31" height="40" />
          )),
        )}
      </g>
      <rect x="352" y="322" width="65" height="97" rx="30" fill="#608ba5" />
      <path d="M385 328v91" stroke="#a1c5d8" strokeWidth="3" />
      <g fill="#fff5e0">
        {[270, 310, 444, 484].map((x) => (
          <rect key={x} x={x} y="321" width="13" height="98" />
        ))}
      </g>
      <text
        x="383"
        y="221"
        textAnchor="middle"
        fill="#49637d"
        fontSize="10"
        letterSpacing="4"
        fontWeight="700"
      >
        UNIVERSIDAD
      </text>
      <circle cx="383" cy="170" r="13" fill="#fff8e8" />
      <path d="M383 161v10l7 4" stroke="#6589a5" fill="none" strokeWidth="2" />
      <path d="M383 121V68" stroke="#7795aa" strokeWidth="3" />
      <path d="M385 68h41l-8 12 8 12h-41" fill="#4b94ef" />
      <g>
        <path
          d="M42 429L52 241M711 441l-9-210"
          stroke="#a68f6a"
          strokeWidth="12"
        />
        <g fill="#88b79a">
          <circle cx="34" cy="250" r="53" />
          <circle cx="76" cy="280" r="48" />
          <circle cx="22" cy="306" r="45" />
          <circle cx="707" cy="234" r="50" />
          <circle cx="680" cy="271" r="45" />
          <circle cx="738" cy="280" r="49" />
        </g>
        <g fill="#add09f">
          <circle cx="37" cy="224" r="34" />
          <circle cx="75" cy="259" r="32" />
          <circle cx="703" cy="212" r="33" />
          <circle cx="734" cy="252" r="31" />
        </g>
      </g>
      <g filter="url(#shadow)" transform="translate(452 350) rotate(-8)">
        <rect width="216" height="140" rx="18" fill="white" />
        <rect x="18" y="20" width="39" height="42" rx="9" fill="#e4efff" />
        <text
          x="37"
          y="48"
          textAnchor="middle"
          fill="#2276e9"
          fontSize="23"
          fontWeight="bold"
        >
          A+
        </text>
        <text x="71" y="35" fill="#173465" fontSize="13" fontWeight="bold">
          Expediente #024
        </text>
        <text x="71" y="55" fill="#7a8ba2" fontSize="10">
          Una pista lo cambia todo
        </text>
        <path d="M20 79h175M20 110h175" stroke="#edf2f7" />
        <text x="22" y="101" fill="#6c819d" fontSize="12">
          Nota registrada
        </text>
        <text x="156" y="102" fill="#3288ec" fontSize="20" fontWeight="bold">
          17
        </text>
        <circle cx="202" cy="12" r="20" fill="#ffc76c" />
        <text
          x="202"
          y="20"
          textAnchor="middle"
          fill="#8a5b19"
          fontSize="25"
          fontWeight="bold"
        >
          !
        </text>
      </g>
      <g transform="translate(164 413)">
        <circle r="9" fill="#d9a679" />
        <path d="M-12 17q12-14 24 0v31h-24" fill="#418ad9" />
        <path d="M-6 48v24M6 48v24" stroke="#3d5975" strokeWidth="7" />
      </g>
      <g transform="translate(297 427)">
        <circle r="8" fill="#a87757" />
        <path d="M-10 15q10-12 20 0v25h-20" fill="#bf9bce" />
        <path d="M-5 40v23M5 40v23" stroke="#576981" strokeWidth="6" />
      </g>
      <g fill="#80aa8b">
        <ellipse cx="109" cy="461" rx="36" ry="10" />
        <ellipse cx="603" cy="524" rx="68" ry="10" />
      </g>
      <path d="M95 440h51m-45 0v12m39-12v12" stroke="#b79a74" strokeWidth="8" />
    </svg>
  );
}
