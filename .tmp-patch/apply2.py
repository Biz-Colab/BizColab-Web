import sys, io
src, out = sys.argv[1], sys.argv[2]
h = io.open(src, encoding='utf-8').read()
D = '.tmp-patch/'
sec = io.open(D+'concepts.html', encoding='utf-8').read()
css = io.open(D+'concepts.css', encoding='utf-8').read()
cta = io.open(D+'cta.html', encoding='utf-8').read()

assert 'id="concepts"' not in h, 'ALREADY APPLIED'
assert 'id="streetpulse"' in h, 'streetpulse section missing - wrong base'

A = '\n<section id="synergy">'
assert h.count(A) == 1
h = h.replace(A, sec + A, 1)

B = '  <a href="#synergy">Synergies</a>'
assert h.count(B) == 1
h = h.replace(B, '  <a href="#concepts">Concepts</a>\n' + B, 1)

C = '&ldquo;StreetPulse: twenty consumers, three minutes, one clear answer &mdash; the voice of the market on camera, for a fraction of a focus group.&rdquo;</p></div>\n'
assert h.count(C) == 1, ('breath anchor', h.count(C))
h = h.replace(C, C + cta, 1)

E = '</style>'
assert h.count(E) == 1
h = h.replace(E, css + E, 1)

io.open(out, 'w', encoding='utf-8').write(h)
print('OK bytes', len(h))
