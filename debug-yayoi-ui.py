# -*- coding: utf-8 -*-
"""
弥生販売 UI構造調査スクリプト
得意先台帳画面のUI要素を列挙してExcelボタンを探す
"""
from pywinauto import Application, Desktop
from pywinauto.findwindows import find_windows
import sys
import io
import time

# UTF-8設定
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')

def inspect_yayoi_ui():
    print("=" * 60)
    print("弥生販売 UI構造調査（詳細版）")
    print("=" * 60)

    # 方法1: タイトルで弥生販売プロセスに接続
    try:
        print("\n--- 弥生販売プロセスに接続 ---")
        # 複数ウィンドウがある場合は最初のものを選択
        app = Application(backend="uia").connect(title_re=".*弥生販売.*管理者.*", timeout=5)
        print("✓ 弥生販売プロセスに接続しました")

        # プロセス内の全ウィンドウを取得
        print("\n--- プロセス内の全ウィンドウ ---")
        all_windows = app.windows()
        print(f"ウィンドウ数: {len(all_windows)}")

        for i, win in enumerate(all_windows):
            try:
                win_title = win.window_text() or "(タイトルなし)"
                win_class = win.class_name() or "(クラス不明)"
                print(f"\n[{i}] {win_title}")
                print(f"    Class: {win_class}")
                print(f"    Handle: {win.handle}")
            except Exception as e:
                print(f"[{i}] エラー: {e}")

        # メインウィンドウを取得
        print("\n--- メインウィンドウのUI構造 ---")
        main_win = app.window(title_re=".*弥生販売.*管理者.*")

        # print_control_identifiers で全構造をダンプ（最初の部分のみ）
        print("\n--- コントロール構造（深さ3まで） ---")
        try:
            main_win.print_control_identifiers(depth=3)
        except Exception as e:
            print(f"構造ダンプエラー: {e}")

        # 得意先台帳を探す
        print("\n--- 「得意先台帳」を含むコントロール ---")
        try:
            for ctrl in main_win.descendants():
                try:
                    ctrl_name = ctrl.window_text() or ""
                    if "得意先" in ctrl_name or "台帳" in ctrl_name:
                        ctrl_class = ctrl.class_name() or ""
                        print(f"  ★ 発見: [{ctrl_name}] (Class: {ctrl_class})")
                except:
                    pass
        except Exception as e:
            print(f"検索エラー: {e}")

        # Excel関連を探す
        print("\n--- 「Excel」を含むコントロール ---")
        try:
            found = False
            for ctrl in main_win.descendants():
                try:
                    ctrl_name = ctrl.window_text() or ""
                    if "Excel" in ctrl_name:
                        found = True
                        ctrl_class = ctrl.class_name() or ""
                        print(f"  ★ 発見: [{ctrl_name}] (Class: {ctrl_class})")
                        try:
                            rect = ctrl.rectangle()
                            print(f"       位置: ({rect.left}, {rect.top}, {rect.right}, {rect.bottom})")
                        except:
                            pass
                except:
                    pass
            if not found:
                print("  Excelコントロールは見つかりませんでした")
        except Exception as e:
            print(f"Excel検索エラー: {e}")

        # ボタンを全て列挙
        print("\n--- 全ボタン一覧（最初の30個） ---")
        try:
            button_count = 0
            for ctrl in main_win.descendants():
                try:
                    ctrl_class = ctrl.class_name() or ""
                    if "Button" in ctrl_class or ctrl_class == "Button":
                        ctrl_name = ctrl.window_text() or "(名前なし)"
                        print(f"  Button: [{ctrl_name}] (Class: {ctrl_class})")
                        button_count += 1
                        if button_count >= 30:
                            print("  ... (30個で打ち切り)")
                            break
                except:
                    pass
            if button_count == 0:
                print("  ボタンが見つかりませんでした")
        except Exception as e:
            print(f"ボタン検索エラー: {e}")

    except Exception as e:
        print(f"接続エラー: {e}")
        import traceback
        traceback.print_exc()

    # 方法2: Win32 APIで子ウィンドウを探す
    print("\n" + "=" * 60)
    print("Win32 API による子ウィンドウ検索")
    print("=" * 60)

    try:
        import ctypes
        from ctypes import wintypes

        user32 = ctypes.windll.user32

        # グローバルリストでウィンドウを収集
        global win32_results
        win32_results = []

        def enum_windows_callback(hwnd, lparam):
            length = user32.GetWindowTextLengthW(hwnd)
            if length > 0:
                buffer = ctypes.create_unicode_buffer(length + 1)
                user32.GetWindowTextW(hwnd, buffer, length + 1)
                title = buffer.value
                if "弥生販売" in title or "得意先" in title:
                    win32_results.append((hwnd, title))
            return True

        WNDENUMPROC = ctypes.WINFUNCTYPE(wintypes.BOOL, wintypes.HWND, wintypes.LPARAM)
        callback = WNDENUMPROC(enum_windows_callback)
        user32.EnumWindows(callback, 0)

        print(f"\n弥生販売関連ウィンドウ数: {len(win32_results)}")
        for hwnd, title in win32_results:
            print(f"  HWND: {hwnd}, Title: {title}")

            # 子ウィンドウを列挙
            global child_win_results
            child_win_results = []

            def enum_child_callback(child_hwnd, lparam):
                length = user32.GetWindowTextLengthW(child_hwnd)
                buffer = ctypes.create_unicode_buffer(length + 1)
                user32.GetWindowTextW(child_hwnd, buffer, length + 1)
                title = buffer.value
                if title:  # タイトルがあるもののみ
                    child_win_results.append((child_hwnd, title))
                return True

            child_callback = WNDENUMPROC(enum_child_callback)
            user32.EnumChildWindows(hwnd, child_callback, 0)
            print(f"    子ウィンドウ数（タイトルあり）: {len(child_win_results)}")

            # Excel関連の子ウィンドウを探す
            for child_hwnd, child_title in child_win_results:
                if "Excel" in child_title or "得意先" in child_title or "台帳" in child_title:
                    print(f"    ★ 発見: HWND={child_hwnd}, Title={child_title}")

            # 子ウィンドウを最初の20個表示
            print(f"    子ウィンドウ一覧（最初の20個）:")
            for i, (child_hwnd, child_title) in enumerate(child_win_results[:20]):
                print(f"      [{i}] {child_title}")

    except Exception as e:
        print(f"Win32 API エラー: {e}")
        import traceback
        traceback.print_exc()

    print("\n" + "=" * 60)
    print("調査完了")
    print("=" * 60)

if __name__ == '__main__':
    print("※ 弥生販売で得意先台帳画面を開いた状態で実行してください")
    print("")
    inspect_yayoi_ui()
