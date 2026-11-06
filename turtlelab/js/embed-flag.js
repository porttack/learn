// TurtleLab: is the app inside a lesson page?
// Copyright (C) 2026 Eric Brown. Licensed under the GNU AGPL-3.0 or later.
// See COPYING in the folder above this one.
//
// A lesson page shows a demo by putting TurtleLab in a frame with ?embed=1 on the end of its address. This one line puts a class on the page before it is
// drawn, so the stylesheet can show the slim toolbar from the start and the whole one never flashes up in a small frame. (The rest of embed mode is in
// ui/main.js.) It is a file of its own because the page may have no inline script.
if (new URLSearchParams(location.search).get('embed') === '1') document.documentElement.classList.add('embedded');
