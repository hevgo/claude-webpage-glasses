#!/usr/bin/env python3
"""Generates the placeholder glasses-frame SVGs in assets/frames/.

Encodes the authoring convention documented in CLAUDE.md: viewBox
"0 0 400 160", bridge anchor at the geometric center (200,80), and each
lens's refEyeSpan (recorded separately in js/frames.js) matching the
lens-center positions used here. Run this to regenerate all six frames
after tweaking a shape/color/gradient below, or as a starting point for a
new style -- don't hand-edit the SVG XML directly, since the ring/bridge
math is easy to get subtly wrong by hand (see the contact-point helpers).

Rendering approach: filled rims (a ring shape via fill-rule="evenodd", not
just a stroked outline) with a material-shading gradient, hinges, bridges,
tapered temples, and (for aviator) nose pads. Lens openings are left fully
transparent -- no fill, no tint -- since this renders as an overlay on top
of a real photo and must not obscure the wearer's eyes.

Usage: python3 scripts/generate-frames.py   (run from the repo root)
"""
import math
import os

OUT_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "assets", "frames")


def circle_path(cx, cy, r):
    return f"M {cx+r:.2f},{cy:.2f} A {r:.2f},{r:.2f} 0 1 0 {cx-r:.2f},{cy:.2f} A {r:.2f},{r:.2f} 0 1 0 {cx+r:.2f},{cy:.2f} Z"


def circle_ring(cx, cy, r_outer, r_inner):
    return circle_path(cx, cy, r_outer) + " " + circle_path(cx, cy, r_inner)


def rrect_path(cx, cy, w, h, rx, ry=None):
    ry = ry if ry is not None else rx
    x, y = cx - w / 2, cy - h / 2
    return (
        f"M {x+rx:.2f},{y:.2f} "
        f"L {x+w-rx:.2f},{y:.2f} "
        f"A {rx:.2f},{ry:.2f} 0 0 1 {x+w:.2f},{y+ry:.2f} "
        f"L {x+w:.2f},{y+h-ry:.2f} "
        f"A {rx:.2f},{ry:.2f} 0 0 1 {x+w-rx:.2f},{y+h:.2f} "
        f"L {x+rx:.2f},{y+h:.2f} "
        f"A {rx:.2f},{ry:.2f} 0 0 1 {x:.2f},{y+h-ry:.2f} "
        f"L {x:.2f},{y+ry:.2f} "
        f"A {rx:.2f},{ry:.2f} 0 0 1 {x+rx:.2f},{y:.2f} Z"
    )


def rrect_ring(cx, cy, w, h, rx, thickness):
    outer = rrect_path(cx, cy, w, h, rx)
    inner_w, inner_h = w - 2 * thickness, h - 2 * thickness
    inner_rx = max(rx - thickness, 2)
    inner = rrect_path(cx, cy, inner_w, inner_h, inner_rx)
    return outer + " " + inner


def saddle_bridge(left_x, right_x, y, rise, thickness, grad_url):
    """A thin curved band whose ends land ON/INSIDE the rims' inner
    boundary at (left_x, y) and (right_x, y) -- left_x/right_x must be
    computed from the actual rim geometry (see contact-point helpers
    below), not guessed, or the bridge visually floats disconnected from
    the rims."""
    mid_x = (left_x + right_x) / 2
    d = (
        f"M {left_x:.2f},{y:.2f} "
        f"Q {mid_x:.2f},{y-rise:.2f} {right_x:.2f},{y:.2f} "
        f"Q {mid_x:.2f},{y-rise+thickness:.2f} {left_x:.2f},{y:.2f} Z"
    )
    return f'<path d="{d}" fill="{grad_url}"/>'


def circle_inner_contact(cx, r_inner, dy, overlap=4):
    """x where the circle's inner boundary sits at height dy above center,
    pulled `overlap` px further toward the shape's own center for a solid
    visual fusion with the bridge (not just a tangent touch)."""
    dx = math.sqrt(max(r_inner ** 2 - dy ** 2, 0))
    return cx + dx - overlap if cx < 200 else cx - dx + overlap


def rrect_inner_contact(cx, half_w, thickness, overlap=4):
    """x of the flat inner wall of a rounded-rect ring (valid as long as
    the bridge's y stays within the flat-wall zone, away from the rounded
    corners -- true for every use of this helper below)."""
    inner_half_w = half_w - thickness
    return cx + inner_half_w - overlap if cx < 200 else cx - inner_half_w + overlap


def scale_points(points, center, factor):
    cx, cy = center
    out = []
    for (x, y) in points:
        out.append((cx + (x - cx) * factor, cy + (y - cy) * factor))
    return out


def smooth_closed_path(points):
    """Catmull-Rom-ish smooth closed path through points, via quadratic
    joins at each point's midpoint (same technique used by the app's own
    hand-drawn strokes in js/overlay.js's spirit, but static here)."""
    n = len(points)
    d = f"M {points[0][0]:.2f},{points[0][1]:.2f} "
    for i in range(n):
        p_cur = points[i]
        p_next = points[(i + 1) % n]
        mid = ((p_cur[0] + p_next[0]) / 2, (p_cur[1] + p_next[1]) / 2)
        d += f"Q {p_cur[0]:.2f},{p_cur[1]:.2f} {mid[0]:.2f},{mid[1]:.2f} "
    d += "Z"
    return d


def organic_ring(points, center, inner_factor):
    outer = smooth_closed_path(points)
    inner = smooth_closed_path(scale_points(points, center, inner_factor))
    return outer + " " + inner


def cateye_points(cx, cy, mirror=1):
    # mirror=1 for left lens (outer/flared side = left, smaller x),
    # mirror=-1 for right lens (outer side = right, larger x), authored
    # around a local (0,0) then offset to (cx,cy).
    pts = [
        (-15, 36),   # inner-bottom
        (-45, 40),   # bottom
        (-70, 24),   # bottom-outer, rising
        (-73, 2),    # outer side lower
        (-88, -22),  # flair tip (the cat-eye wing)
        (-58, -34),  # upper-outer, back from tip
        (-25, -30),  # top
        (5, -18),    # top-inner
        (12, 8),     # inner side down
    ]
    return [(cx + mirror * x, cy + y) for (x, y) in pts]


def teardrop_points(cx, cy):
    pts = [
        (0, -38), (26, -34), (38, -14), (40, 10),
        (32, 30), (10, 40), (-10, 40), (-32, 30),
        (-40, 10), (-38, -14), (-26, -34),
    ]
    return [(cx + x, cy + y) for (x, y) in pts]


def linear_gradient(gid, stops, x1="0%", y1="0%", x2="100%", y2="100%"):
    stop_tags = "".join(f'<stop offset="{o}" stop-color="{c}"/>' for o, c in stops)
    return f'<linearGradient id="{gid}" x1="{x1}" y1="{y1}" x2="{x2}" y2="{y2}">{stop_tags}</linearGradient>'


def hinge(x, y, w=9, h=13, color="#000000", opacity=0.35):
    return f'<rect x="{x-w/2:.2f}" y="{y-h/2:.2f}" width="{w}" height="{h}" rx="2.5" fill="{color}" opacity="{opacity}"/>'


def temple(hinge_x, hinge_y, out_x, out_y, width, color):
    # Tapered temple arm: a quad path from a wider base at the hinge to a
    # narrower tip further out, with a slight upward-then-back curve.
    dx, dy = out_x - hinge_x, out_y - hinge_y
    length = math.hypot(dx, dy)
    nx, ny = -dy / length, dx / length  # normal
    base_w, tip_w = width, width * 0.45
    p1 = (hinge_x + nx * base_w / 2, hinge_y + ny * base_w / 2)
    p2 = (hinge_x - nx * base_w / 2, hinge_y - ny * base_w / 2)
    p3 = (out_x - nx * tip_w / 2, out_y - ny * tip_w / 2)
    p4 = (out_x + nx * tip_w / 2, out_y + ny * tip_w / 2)
    mid = (hinge_x + dx * 0.55, hinge_y + dy * 0.55 - 6)
    d = (
        f"M {p1[0]:.2f},{p1[1]:.2f} "
        f"Q {mid[0]:.2f},{mid[1]:.2f} {p4[0]:.2f},{p4[1]:.2f} "
        f"L {p3[0]:.2f},{p3[1]:.2f} "
        f"Q {mid[0]:.2f},{mid[1]-3:.2f} {p2[0]:.2f},{p2[1]:.2f} Z"
    )
    return f'<path d="{d}" fill="{color}"/>'


def wrap(body, defs=""):
    return (
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 160" width="400" height="160">\n'
        + (f"  <defs>{defs}</defs>\n" if defs else "")
        + body
        + "\n</svg>\n"
    )


# ---------------------------------------------------------------------
# ROUND -- thin gunmetal wire rim, refEyeSpan 170 (centers 115/285)
# ---------------------------------------------------------------------
def round_svg():
    cx1, cx2, cy = 115, 285, 80
    r_inner = 46
    grad = linear_gradient("roundMetal", [("0%", "#6b6b74"), ("55%", "#3d3d45"), ("100%", "#232328")])
    ring = circle_ring(cx1, cy, 53, r_inner) + " " + circle_ring(cx2, cy, 53, r_inner)
    bridge_y = cy - 8
    left_x = circle_inner_contact(cx1, r_inner, 8)
    right_x = circle_inner_contact(cx2, r_inner, 8)
    bridge = saddle_bridge(left_x, right_x, bridge_y, rise=10, thickness=5, grad_url="url(#roundMetal)")
    hinges = hinge(cx1 - 53, cy - 4, color="#232328") + hinge(cx2 + 53, cy - 4, color="#232328")
    temples = temple(cx1 - 53, cy - 2, 22, 58, 7, "#3d3d45") + temple(cx2 + 53, cy - 2, 378, 58, 7, "#3d3d45")
    body = f'  <g fill-rule="evenodd">\n    <path d="{ring}" fill="url(#roundMetal)"/>\n  </g>\n  {bridge}\n  {hinges}\n  {temples}\n'
    return wrap(body, grad)


# ---------------------------------------------------------------------
# SQUARE -- bold black acetate, refEyeSpan 170 (centers 115/285)
# ---------------------------------------------------------------------
def square_svg():
    cx1, cx2, cy = 115, 285, 80
    grad = linear_gradient("squareAcetate", [("0%", "#3a3a3d"), ("50%", "#1c1c1e"), ("100%", "#050505")])
    ring = rrect_ring(cx1, cy, 100, 90, 16, 13) + " " + rrect_ring(cx2, cy, 100, 90, 16, 13)
    bridge_y = cy - 8
    left_x = rrect_inner_contact(cx1, 50, 13)
    right_x = rrect_inner_contact(cx2, 50, 13)
    bridge = saddle_bridge(left_x, right_x, bridge_y, rise=8, thickness=9, grad_url="url(#squareAcetate)")
    hinges = hinge(cx1 - 50, cy - 10, color="#050505") + hinge(cx2 + 50, cy - 10, color="#050505")
    temples = temple(cx1 - 50, cy - 8, 20, 58, 11, "#1c1c1e") + temple(cx2 + 50, cy - 8, 380, 58, 11, "#1c1c1e")
    body = (
        f'  <g fill-rule="evenodd">\n    <path d="{ring}" fill="url(#squareAcetate)"/>\n  </g>\n'
        f'  {bridge}\n  {hinges}\n  {temples}\n'
    )
    return wrap(body, grad)


# ---------------------------------------------------------------------
# RECTANGLE -- tortoiseshell acetate, refEyeSpan 180 (centers 110/290)
# ---------------------------------------------------------------------
def rectangle_svg():
    cx1, cx2, cy = 110, 290, 80
    grad = linear_gradient("rectTortoise", [("0%", "#8a5a34"), ("50%", "#5c3a20"), ("100%", "#2e1c10")])
    ring = rrect_ring(cx1, cy, 124, 68, 12, 11) + " " + rrect_ring(cx2, cy, 124, 68, 12, 11)
    bridge_y = cy - 4
    left_x = rrect_inner_contact(cx1, 62, 11)
    right_x = rrect_inner_contact(cx2, 62, 11)
    bridge = saddle_bridge(left_x, right_x, bridge_y, rise=7, thickness=8, grad_url="url(#rectTortoise)")
    # mottled tortoiseshell speckles, clipped to the rim ring
    clip_id = "rectClip"
    clip_def = f'<clipPath id="{clip_id}"><path d="{ring}" fill-rule="evenodd"/></clipPath>'
    speckles = "".join(
        f'<ellipse cx="{x}" cy="{y}" rx="{rx}" ry="{ry}" fill="#c98a4a" opacity="0.35" transform="rotate({rot} {x} {y})"/>'
        for x, y, rx, ry, rot in [
            (72, 62, 9, 4, 20), (150, 96, 7, 3, -15), (238, 60, 8, 4, 10),
            (330, 98, 9, 4, -25), (60, 100, 6, 3, 30), (340, 62, 6, 3, -10),
        ]
    )
    hinges = hinge(cx1 - 62, cy - 4, color="#2e1c10") + hinge(cx2 + 62, cy - 4, color="#2e1c10")
    temples = temple(cx1 - 62, cy - 2, 14, 56, 9, "#5c3a20") + temple(cx2 + 62, cy - 2, 386, 56, 9, "#5c3a20")
    body = (
        f'  <g fill-rule="evenodd">\n    <path d="{ring}" fill="url(#rectTortoise)"/>\n  </g>\n'
        f'  {bridge}\n'
        f'  <g clip-path="url(#{clip_id})">{speckles}</g>\n  {hinges}\n  {temples}\n'
    )
    return wrap(body, grad + clip_def)


# ---------------------------------------------------------------------
# CAT-EYE -- burgundy acetate, refEyeSpan 170 (centers 115/285)
# ---------------------------------------------------------------------
def cateye_svg():
    cx1, cx2, cy = 115, 285, 80
    inner_factor = 0.80
    grad = linear_gradient("cateyeAcetate", [("0%", "#a8495c"), ("50%", "#7a2e3a"), ("100%", "#431722")])
    left_pts = cateye_points(cx1, cy, mirror=1)
    right_pts = cateye_points(cx2, cy, mirror=-1)
    ring = organic_ring(left_pts, (cx1, cy), inner_factor) + " " + organic_ring(right_pts, (cx2, cy), inner_factor)
    # point index 8 ("inner side down") is each lens's nose-side contact on
    # the inner boundary -- pull 3px further toward center for solid fusion.
    left_inner = scale_points(left_pts, (cx1, cy), inner_factor)[8]
    right_inner = scale_points(right_pts, (cx2, cy), inner_factor)[8]
    left_x, bridge_y = left_inner[0] + 3, left_inner[1]
    right_x = right_inner[0] - 3
    # This shape's inner contact points sit far apart (~145px, vs ~87px for
    # round) since the cat-eye flair pulls the outer boundary way out on the
    # temple side, leaving the nose side close to each lens's own center --
    # a shallow rise reads as a flat hairline across that much span, so this
    # needs a taller arch than the other styles to still look like a bridge.
    bridge = saddle_bridge(left_x, right_x, bridge_y, rise=18, thickness=7, grad_url="url(#cateyeAcetate)")
    hinges = hinge(cx1 - 88, cy - 18, w=8, h=11, color="#431722") + hinge(cx2 + 88, cy - 18, w=8, h=11, color="#431722")
    temples = temple(cx1 - 88, cy - 18, 20, 44, 8, "#7a2e3a") + temple(cx2 + 88, cy - 18, 380, 44, 8, "#7a2e3a")
    body = f'  <g fill-rule="evenodd">\n    <path d="{ring}" fill="url(#cateyeAcetate)"/>\n  </g>\n  {bridge}\n  {hinges}\n  {temples}\n'
    return wrap(body, grad)


# ---------------------------------------------------------------------
# AVIATOR -- gold metal, refEyeSpan 180 (centers 110/290)
# ---------------------------------------------------------------------
def aviator_svg():
    cx1, cx2, cy = 110, 290, 78
    inner_factor = 0.86
    grad = linear_gradient("aviatorMetal", [("0%", "#f0cd7a"), ("45%", "#c99a3d"), ("100%", "#7a5a1c")])
    left_pts = teardrop_points(cx1, cy)
    right_pts = teardrop_points(cx2, cy)
    ring = organic_ring(left_pts, (cx1, cy), inner_factor) + " " + organic_ring(right_pts, (cx2, cy), inner_factor)
    # index 3, (40,10) local -> each lens's nose-side upper contact point,
    # used for the small double-bridge piece between the lenses.
    left_inner = scale_points(left_pts, (cx1, cy), inner_factor)[3]
    right_inner = scale_points(right_pts, (cx2, cy), inner_factor)[8]  # (-40,10) local, mirrored position
    bridge_left_x, bridge_right_x = left_inner[0] + 3, right_inner[0] - 3
    double_bridge = saddle_bridge(
        bridge_left_x, bridge_right_x, (left_inner[1] + right_inner[1]) / 2, rise=12, thickness=5, grad_url="url(#aviatorMetal)"
    )
    # index 10, (-26,-34) local -> left lens's outer-top point; the browbar
    # spans outer-top to outer-top as a single gentle arch over both lenses
    # (no seagull dip -- a multi-curve dipped path self-intersected into a
    # stray loop, so keep this to the same safe 2-point saddle construction
    # used everywhere else).
    left_outer_top = teardrop_points(cx1, cy)[10]
    right_outer_top = teardrop_points(cx2, cy)[1]  # (26,-34) local -> right lens's outer-top
    browbar = saddle_bridge(left_outer_top[0], right_outer_top[0], left_outer_top[1] + 2, rise=16, thickness=5, grad_url="url(#aviatorMetal)")
    nose_pads = (
        f'<ellipse cx="{bridge_left_x-4:.1f}" cy="{left_inner[1]+14:.1f}" rx="4.5" ry="7" fill="#c99a3d" opacity="0.9"/>'
        f'<ellipse cx="{bridge_right_x+4:.1f}" cy="{right_inner[1]+14:.1f}" rx="4.5" ry="7" fill="#c99a3d" opacity="0.9"/>'
    )
    hinges = hinge(cx1 - 41, cy - 4, w=7, h=10, color="#7a5a1c") + hinge(cx2 + 41, cy - 4, w=7, h=10, color="#7a5a1c")
    temples = temple(cx1 - 41, cy - 2, 20, 42, 5, "#c99a3d") + temple(cx2 + 41, cy - 2, 380, 42, 5, "#c99a3d")
    body = (
        f'  <g fill-rule="evenodd">\n    <path d="{ring}" fill="url(#aviatorMetal)"/>\n  </g>\n'
        f'  {browbar}\n  {double_bridge}\n  {nose_pads}\n  {hinges}\n  {temples}\n'
    )
    return wrap(body, grad)


# ---------------------------------------------------------------------
# BROWLINE -- black acetate brow + thin gold metal rim, refEyeSpan 176
# ---------------------------------------------------------------------
def browline_svg():
    cx1, cx2, cy = 112, 288, 82
    grad_gold = linear_gradient("browGold", [("0%", "#e6c162"), ("50%", "#b8912f"), ("100%", "#7a5e1a")])
    grad_black = linear_gradient("browBlack", [("0%", "#3a3a3d"), ("60%", "#1a1a1c"), ("100%", "#050505")])
    thin_ring = rrect_ring(cx1, cy, 90, 78, 13, 5) + " " + rrect_ring(cx2, cy, 90, 78, 13, 5)
    bridge_y = cy - 4
    left_x = rrect_inner_contact(cx1, 45, 5)
    right_x = rrect_inner_contact(cx2, 45, 5)
    bridge = saddle_bridge(left_x, right_x, bridge_y, rise=6, thickness=6, grad_url="url(#browGold)")
    brow_left = (
        f"M {cx1-49},{cy-16} "
        f"Q {cx1-49},{cy-39} {cx1},{cy-39} "
        f"Q {cx1+49},{cy-39} {cx1+49},{cy-16} "
        f"Q {cx1+49},{cy-24} {cx1},{cy-26} "
        f"Q {cx1-49},{cy-24} {cx1-49},{cy-16} Z"
    )
    brow_right = (
        f"M {cx2-49},{cy-16} "
        f"Q {cx2-49},{cy-39} {cx2},{cy-39} "
        f"Q {cx2+49},{cy-39} {cx2+49},{cy-16} "
        f"Q {cx2+49},{cy-24} {cx2},{cy-26} "
        f"Q {cx2-49},{cy-24} {cx2-49},{cy-16} Z"
    )
    hinges = hinge(cx1 - 45, cy - 4, color="#050505") + hinge(cx2 + 45, cy - 4, color="#050505")
    temples = temple(cx1 - 45, cy - 2, 22, 56, 8, "#1a1a1c") + temple(cx2 + 45, cy - 2, 378, 56, 8, "#1a1a1c")
    body = (
        f'  <g fill-rule="evenodd">\n    <path d="{thin_ring}" fill="url(#browGold)"/>\n  </g>\n'
        f'  {bridge}\n'
        f'  <path d="{brow_left}" fill="url(#browBlack)"/>\n'
        f'  <path d="{brow_right}" fill="url(#browBlack)"/>\n'
        f'  {hinges}\n  {temples}\n'
    )
    return wrap(body, grad_gold + grad_black)


STYLES = {
    "round": round_svg,
    "square": square_svg,
    "rectangle": rectangle_svg,
    "cat-eye": cateye_svg,
    "aviator": aviator_svg,
    "browline": browline_svg,
}

if __name__ == "__main__":
    for name, fn in STYLES.items():
        content = fn()
        path = os.path.join(OUT_DIR, f"{name}.svg")
        with open(path, "w") as f:
            f.write(content)
        print(f"wrote {path} ({len(content)} bytes)")
