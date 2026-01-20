# -*- coding: utf-8 -*-
"""
弥生販売 UI構造調査スクリプト
得意先台帳画面のUI要素を列挙してExcelボタンを探す
"""
from pywinauto import Application, Desktop
import sys
import io
import time

# UTF-8設定
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')

def inspect_yayoi_ui():
    print("=" * 60)
    print("弥生販売 UI構造調査")
    print("=" * 60)

    # デスクトップから弥生販売ウィンドウを探す
    desktop = Desktop(backend="uia")

    yayoi_windows = []
    for window in desktop.windows():
        try:
            title = window.window_text()
            if "弥生販売" in title or "得意先台帳" in title:
                yayoi_windows.append((window, title))
                print(f"\n発見: {title}")
        except:
            pass

    if not yayoi_windows:
        print("❌ 弥生販売のウィンドウが見つかりません")
        return

    # 各ウィンドウのUI構造を調査
    for window, title in yayoi_windows:
        print(f"\n{'=' * 60}")
        print(f"ウィンドウ: {title}")
        print(f"{'=' * 60}")

        try:
            # Applicationオブジェクトとして接続
            app = Application(backend="uia").connect(handle=window.handle)
            main_win = app.window(handle=window.handle)

            print("\n--- ツールバー検索 ---")
            try:
                toolbars = main_win.children(control_type="ToolBar")
                print(f"ツールバー数: {len(toolbars)}")
                for i, tb in enumerate(toolbars):
                    tb_name = tb.window_text() or "(名前なし)"
                    print(f"\n  ToolBar[{i}]: {tb_name}")
                    try:
                        buttons = tb.children()
                        for j, btn in enumerate(buttons):
                            btn_name = btn.window_text() or "(名前なし)"
                            btn_type = btn.control_type() or "(不明)"
                            print(f"    [{j}] {btn_name} ({btn_type})")
                    except Exception as e:
                        print(f"    ボタン列挙エラー: {e}")
            except Exception as e:
                print(f"ツールバー検索エラー: {e}")

            print("\n--- 全コントロール探索（Excel関連） ---")
            try:
                found_excel = False
                for ctrl in main_win.descendants():
                    try:
                        ctrl_name = ctrl.window_text() or ""
                        ctrl_type = ctrl.control_type() or ""
                        ctrl_class = ctrl.class_name() or ""

                        # Excel関連を探す
                        if "Excel" in ctrl_name or "excel" in ctrl_name.lower():
                            found_excel = True
                            print(f"  ★ Excel発見: [{ctrl_name}]")
                            print(f"       Type: {ctrl_type}")
                            print(f"       Class: {ctrl_class}")
                            try:
                                rect = ctrl.rectangle()
                                print(f"       位置: ({rect.left}, {rect.top}) - ({rect.right}, {rect.bottom})")
                            except:
                                pass
                    except:
                        pass

                if not found_excel:
                    print("  Excelコントロールは見つかりませんでした")

            except Exception as e:
                print(f"全探索エラー: {e}")

            print("\n--- 子ウィンドウ一覧 ---")
            try:
                children = main_win.children()
                print(f"直接の子要素数: {len(children)}")
                for i, child in enumerate(children[:20]):  # 最初の20個
                    child_name = child.window_text() or "(名前なし)"
                    child_type = child.control_type() or "(不明)"
                    child_class = child.class_name() or "(不明)"
                    print(f"  [{i}] {child_name[:30]} ({child_type}) - {child_class}")
            except Exception as e:
                print(f"子ウィンドウ列挙エラー: {e}")

        except Exception as e:
            print(f"ウィンドウ調査エラー: {e}")
            import traceback
            traceback.print_exc()

    print("\n" + "=" * 60)
    print("調査完了")
    print("=" * 60)

if __name__ == '__main__':
    # 得意先台帳が開いている状態で実行してください
    print("※ 弥生販売で得意先台帳画面を開いた状態で実行してください")
    print("")
    inspect_yayoi_ui()
