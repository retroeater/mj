#!/usr/bin/env python3
"""OGP画像 img/ogp.png を生成する。(#78)

方針:
  - 内容は「ryoei.pro」の文字のみ。1200x630、背景#ffffff、文字#212529。
    サブテキスト・運営者名・表のモチーフ・麻雀牌は入れない。件数も
    入れない(静止画で陳腐化するため。説明文は #158 の description が担う)
  - 全ページ共通の1枚。ページ別の出し分けは新サイトで再検討する
  - SVGを経由せず Pillow で直接描画する。ImageMagickのsvgデリゲートは
    rsvg-convertに委譲する設定で、未インストール環境では内蔵レンダラーに
    フォールバックしフォントの当たり方が不安定になるため
  - 生成物のPNGもコミットする。生成環境のフォント差で再生成のたびに
    差分が出るのを避けるため

使い方:
    python3 scripts/build_ogp_image.py          # img/ogp.png を書き出す
    python3 scripts/build_ogp_image.py --check   # 書き換えず、現在の内容と一致するか確認
"""
import argparse
import io
import pathlib
import sys

try:
    from PIL import Image, ImageDraw, ImageFont
except ModuleNotFoundError:
    sys.exit("Pillowが必要です: pip install Pillow")

REPO_ROOT = pathlib.Path(__file__).parent.parent
OUT_PATH = REPO_ROOT / "img" / "ogp.png"

WIDTH, HEIGHT = 1200, 630
BG_COLOR = "#ffffff"
TEXT_COLOR = "#212529"  # Bootstrapの$gray-900。サイト本文と同じ色
TEXT = "ryoei.pro"
FONT_SIZE = 120

# 見つかった最初のものを使う。候補にない環境では明示的に失敗させ、
# Pillow内蔵のビットマップフォントへ黙ってフォールバックさせない
# (フォントが変わると画像が変わり、コミット済みのPNGと差分が出るため)
FONT_CANDIDATES = (
    # Noto Sans
    "/usr/share/fonts/truetype/noto/NotoSans-Regular.ttf",
    "/usr/share/fonts/noto/NotoSans-Regular.ttf",
    "/usr/share/fonts/truetype/google-noto/NotoSans-Regular.ttf",
    "/Library/Fonts/NotoSans-Regular.ttf",
    # Noto Sans CJK JP
    "/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc",
    "/usr/share/fonts/opentype/noto/NotoSansCJKjp-Regular.otf",
    "/usr/share/fonts/truetype/noto/NotoSansCJKjp-Regular.otf",
    "/System/Library/Fonts/NotoSansCJK.ttc",
    # DejaVu Sans
    "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
    "/usr/share/fonts/dejavu/DejaVuSans.ttf",
)


def load_font():
    """候補パスを順に試してフォントを読み込む。"""
    for path in FONT_CANDIDATES:
        if pathlib.Path(path).is_file():
            return ImageFont.truetype(path, FONT_SIZE), path
    raise SystemExit(
        "フォントが見つかりません。次のいずれかを入れてください:\n"
        "  Noto Sans (Debian/Ubuntu: fonts-noto-core)\n"
        "  Noto Sans CJK JP (fonts-noto-cjk)\n"
        "  DejaVu Sans (fonts-dejavu-core)\n"
        "探索したパス:\n  " + "\n  ".join(FONT_CANDIDATES)
    )


def render():
    """PNGのバイト列を返す。"""
    font, font_path = load_font()
    image = Image.new("RGB", (WIDTH, HEIGHT), BG_COLOR)
    draw = ImageDraw.Draw(image)

    # anchorではなく実際に描かれる範囲(インクのbbox)を基準に中央へ置く。
    # "ryoei.pro"はyとpの下がり、iとoの高さが不揃いで、フォントのem箱の
    # 中心に合わせると見た目が上下にずれるため
    left, top, right, bottom = draw.textbbox((0, 0), TEXT, font=font)
    draw.text(
        ((WIDTH - (right - left)) / 2 - left,
         (HEIGHT - (bottom - top)) / 2 - top),
        TEXT,
        font=font,
        fill=TEXT_COLOR,
    )

    buf = io.BytesIO()
    # optimize=Trueで圧縮。Pillowは既定でtIMEチャンク(生成時刻)を書かない
    # ため、同じフォントなら何度実行しても同じバイト列になる
    image.save(buf, format="PNG", optimize=True)
    return buf.getvalue(), font_path


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--check", action="store_true",
                    help="書き換えず、コミット済みのPNGと一致するかだけ確認する")
    args = ap.parse_args()

    data, font_path = render()

    if args.check:
        if not OUT_PATH.exists():
            print(f"{OUT_PATH.relative_to(REPO_ROOT)} がありません", file=sys.stderr)
            return 1
        if OUT_PATH.read_bytes() != data:
            print(f"{OUT_PATH.relative_to(REPO_ROOT)} が生成結果と一致しません "
                  f"(使用フォント: {font_path})", file=sys.stderr)
            return 1
        print(f"一致: {OUT_PATH.relative_to(REPO_ROOT)}")
        return 0

    OUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    OUT_PATH.write_bytes(data)
    print(f"書き出し: {OUT_PATH.relative_to(REPO_ROOT)} "
          f"({WIDTH}x{HEIGHT}, {len(data):,} bytes)")
    print(f"使用フォント: {font_path}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
