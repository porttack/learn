// The old address of JSLogo (/jslogo/) now only sends people to the new one (/logo/), keeping a program that was in the
// address (after the # or the ?). It asks for nothing and stores nothing. Delete this folder when nothing links here any more.
location.replace('../logo/' + location.search + location.hash);
