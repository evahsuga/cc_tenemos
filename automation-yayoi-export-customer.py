# -*- coding: utf-8 -*-
"""
弥生販売26 顧客リストExcelエクスポート自動化
Step 3-1: 弥生販売から顧客リストをExcelファイルとしてエクスポート

処理フロー:
1. 弥生販売に接続
2. 台帳(D) → 顧客台帳(A) で得意先台帳を開く
3. Excelボタンをクリック
4. 「Excelへの書き出し」ダイアログでファイル名を設定してOK
"""
from pywinauto import Application
from pywinauto.findwindows import ElementNotFoundError
import sys
import json
import time
import io
from datetime import datetime

# 標準出力・標準エラー出力をUTF-8に設定（Windows文字化け対策）
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')

class YayoiCustomerExportAutomation:
    def __init__(self):
        self.app = None
        self.main_window = None
        # 出力ファイル名（日付6桁を付与）
        self.output_filename = f"DLca_APP_INP00000{datetime.now().strftime('%y%m%d')}"

    def connect_to_yayoi(self):
        """弥生販売に接続（メインウィンドウを優先的に選択）"""
        try:
            print("弥生販売に接続しています...", file=sys.stderr)

            # デスクトップから全ウィンドウを取得して、適切なメインウィンドウを探す
            from pywinauto import Desktop
            desktop = Desktop(backend="uia")

            # 弥生販売のウィンドウを全て取得
            yayoi_windows = []
            for window in desktop.windows():
                try:
                    title = window.window_text()
                    if "弥生販売" in title:
                        yayoi_windows.append((window, title))
                        print(f"  発見: {title}", file=sys.stderr)
                except:
                    pass

            if not yayoi_windows:
                print("❌ 弥生販売のウィンドウが見つかりません", file=sys.stderr)
                return False

            # メインウィンドウを選択する優先順位
            # 1. 「管理者」を含むウィンドウ（伝票、台帳以外）
            # 2. 「プロフェッショナル」を含むウィンドウ（伝票、台帳以外）
            # 3. 「スタンダード」を含むウィンドウ（伝票、台帳以外）
            # 4. 最初の弥生販売ウィンドウ（伝票、台帳以外）

            selected_window = None

            # 優先度1: 「管理者」を含むウィンドウ（伝票、台帳ではない）
            for window, title in yayoi_windows:
                if "管理者" in title and "伝票" not in title and "台帳" not in title:
                    selected_window = (window, title)
                    print(f"  → メインウィンドウ（管理者）を選択: {title}", file=sys.stderr)
                    break

            # 優先度2: 「プロフェッショナル」を含むウィンドウ（伝票、台帳ではない）
            if not selected_window:
                for window, title in yayoi_windows:
                    if "プロフェッショナル" in title and "伝票" not in title and "台帳" not in title:
                        selected_window = (window, title)
                        print(f"  → メインウィンドウ（プロフェッショナル）を選択: {title}", file=sys.stderr)
                        break

            # 優先度3: 「スタンダード」を含むウィンドウ（伝票、台帳ではない）
            if not selected_window:
                for window, title in yayoi_windows:
                    if "スタンダード" in title and "伝票" not in title and "台帳" not in title:
                        selected_window = (window, title)
                        print(f"  → メインウィンドウ（スタンダード）を選択: {title}", file=sys.stderr)
                        break

            # 優先度4: 最初に見つかった弥生販売ウィンドウ（伝票、台帳ではない）
            if not selected_window:
                for window, title in yayoi_windows:
                    if "伝票" not in title and "台帳" not in title:
                        selected_window = (window, title)
                        print(f"  → メインウィンドウ（デフォルト）を選択: {title}", file=sys.stderr)
                        break

            if not selected_window:
                # 伝票ウィンドウのみの場合はエラーメッセージを改善
                slip_windows = [t for _, t in yayoi_windows if "伝票" in t or "台帳" in t]
                if slip_windows:
                    print(f"❌ メインウィンドウが見つかりません。開いている伝票/台帳: {slip_windows}", file=sys.stderr)
                    return False
                print("❌ メインウィンドウを特定できませんでした", file=sys.stderr)
                return False

            self.main_window = selected_window[0]

            # Applicationオブジェクトを取得（ウィンドウから親プロセスに接続）
            self.app = Application(backend="uia").connect(handle=self.main_window.handle)

            print(f"✓ 弥生販売に接続しました: {selected_window[1]}", file=sys.stderr)
            return True

        except ElementNotFoundError:
            print("❌ 弥生販売が起動していません", file=sys.stderr)
            return False
        except Exception as e:
            print(f"❌ 接続エラー: {str(e)}", file=sys.stderr)
            import traceback
            traceback.print_exc(file=sys.stderr)
            return False

    def check_for_blocking_dialogs(self):
        """メインウィンドウをブロックしているダイアログを検出"""
        try:
            # プロセス内の全ウィンドウをチェック
            if self.app:
                all_windows = self.app.windows()
                for window in all_windows:
                    try:
                        if window.handle != self.main_window.handle:
                            title = window.window_text() or "(タイトルなし)"
                            print(f"  ⚠ ブロッキングウィンドウ検出: {title}", file=sys.stderr)
                            return title
                    except:
                        pass
            return None
        except:
            return None

    def navigate_to_customer_ledger(self):
        """台帳メニューから顧客台帳を開く"""
        from pywinauto.base_wrapper import ElementNotEnabled
        try:
            print("\n顧客台帳を開いています...", file=sys.stderr)

            # メインウィンドウをアクティブにする
            self.main_window.set_focus()
            time.sleep(0.35)

            # Alt+D で台帳メニューを開く
            print("台帳メニューを開いています...", file=sys.stderr)
            self.main_window.type_keys("%d")  # Alt+D
            time.sleep(0.7)

            # 「顧客台帳(A)」を選択（アクセスキーがAなのでAキーを押す）
            print("顧客台帳(A)を選択しています...", file=sys.stderr)
            self.main_window.type_keys("a")  # A キー
            time.sleep(1.4)

            print("✓ 顧客台帳を開きました", file=sys.stderr)
            return True

        except ElementNotEnabled:
            # メインウィンドウが無効 = ダイアログが開いている可能性
            print("❌ メインウィンドウが無効です（ダイアログが開いている可能性）", file=sys.stderr)
            blocking = self.check_for_blocking_dialogs()
            if blocking:
                print(f"  → ブロックしているウィンドウ: {blocking}", file=sys.stderr)
            return False
        except Exception as e:
            print(f"❌ 顧客台帳オープンエラー: {str(e)}", file=sys.stderr)
            import traceback
            traceback.print_exc(file=sys.stderr)
            return False

    def click_excel_button(self):
        """Excelボタンをクリック（得意先台帳ウィンドウ内から）"""
        try:
            print("\nExcelボタンをクリックしています...", file=sys.stderr)

            # メインウィンドウをアクティブにする
            self.main_window.set_focus()
            time.sleep(0.35)

            # 方法1: UIAutomation でExcelボタンを探す（タイトル検索）
            try:
                print("  → UIAutomationでExcelボタンを検索中...", file=sys.stderr)
                # メインウィンドウの子孫からExcelを探す
                excel_ctrl = self.main_window.child_window(title="Excel")
                if excel_ctrl.exists(timeout=3):
                    print("  ✓ Excelコントロールを発見", file=sys.stderr)
                    excel_ctrl.click_input()  # click_input を使用（より確実）
                    time.sleep(1.0)
                    print("✓ Excelボタンをクリックしました", file=sys.stderr)
                    return True
            except Exception as e:
                print(f"  → child_window検索失敗: {str(e)}", file=sys.stderr)

            # 方法2: 全子孫を探索してExcelを探す
            try:
                print("  → 全子孫を探索中...", file=sys.stderr)
                for ctrl in self.main_window.descendants():
                    try:
                        ctrl_name = ctrl.window_text() or ""
                        if ctrl_name == "Excel":
                            print(f"  ✓ Excelを発見: [{ctrl_name}]", file=sys.stderr)
                            ctrl.click_input()
                            time.sleep(1.0)
                            print("✓ Excelボタンをクリックしました", file=sys.stderr)
                            return True
                    except:
                        pass
            except Exception as e:
                print(f"  → 全探索失敗: {str(e)}", file=sys.stderr)

            # 方法3: 座標クリック（デバッグ結果: 669, 102 - 714, 149）
            # 中心座標を計算: (691, 125)
            print("  → 座標クリックを試行...", file=sys.stderr)
            try:
                import pywinauto.mouse as mouse
                # Excelボタンの中心座標（デバッグで取得した値）
                excel_x = (669 + 714) // 2  # 691
                excel_y = (102 + 149) // 2  # 125
                print(f"    → クリック座標: ({excel_x}, {excel_y})", file=sys.stderr)
                mouse.click(coords=(excel_x, excel_y))
                time.sleep(1.0)
                print("✓ 座標クリックでExcelボタンをクリックしました", file=sys.stderr)
                return True
            except Exception as e:
                print(f"  → 座標クリック失敗: {str(e)}", file=sys.stderr)

            print("❌ Excelボタンが見つかりませんでした", file=sys.stderr)
            return False

        except Exception as e:
            print(f"❌ Excelボタンクリックエラー: {str(e)}", file=sys.stderr)
            import traceback
            traceback.print_exc(file=sys.stderr)
            return False

    def find_export_dialog(self):
        """Excelへの書き出しダイアログを探す"""
        try:
            print("\n「Excelへの書き出し」ダイアログを探しています...", file=sys.stderr)
            time.sleep(1.5)  # ダイアログが開くまで待機

            # 方法1: プロセス内のウィンドウを探す
            if self.app:
                all_windows = self.app.windows()
                print(f"  → プロセス内ウィンドウ数: {len(all_windows)}", file=sys.stderr)
                for window in all_windows:
                    try:
                        title = window.window_text() or ""
                        print(f"    → ウィンドウ: {title}", file=sys.stderr)
                        if "Excel" in title or "書き出し" in title:
                            print(f"  ✓ エクスポートダイアログを発見: {title}", file=sys.stderr)
                            return window
                    except:
                        pass

            # 方法2: メインウィンドウの子ウィンドウとして探す
            try:
                export_dialog = self.main_window.child_window(title_re=".*Excel.*書き出し.*")
                if export_dialog.exists(timeout=2):
                    title = export_dialog.window_text()
                    print(f"  ✓ エクスポートダイアログを発見（子ウィンドウ）: {title}", file=sys.stderr)
                    return export_dialog
            except Exception as e:
                print(f"  → 子ウィンドウ検索失敗: {str(e)}", file=sys.stderr)

            # 方法3: デスクトップからも検索
            from pywinauto import Desktop
            desktop = Desktop(backend="uia")
            for window in desktop.windows():
                try:
                    title = window.window_text() or ""
                    if "Excel" in title and "書き出し" in title:
                        print(f"  ✓ エクスポートダイアログを発見（デスクトップ）: {title}", file=sys.stderr)
                        # Applicationとして接続し直す
                        dialog_app = Application(backend="uia").connect(handle=window.handle)
                        return dialog_app.window(handle=window.handle)
                except:
                    pass

            print("⚠ エクスポートダイアログが見つかりません", file=sys.stderr)
            return None

        except Exception as e:
            print(f"❌ ダイアログ検索エラー: {str(e)}", file=sys.stderr)
            return None

    def fill_export_dialog(self, dialog_window):
        """エクスポートダイアログにファイル名を入力してOK"""
        try:
            print(f"\nファイル名を設定しています: {self.output_filename}", file=sys.stderr)

            # ダイアログをアクティブにする
            dialog_window.set_focus()
            time.sleep(0.5)

            import pywinauto.keyboard as keyboard

            # 方法1: 名称フィールドを直接探す
            try:
                print("  → 名称フィールドを検索中...", file=sys.stderr)
                # ダイアログ内のEditコントロールを探す
                edits = []
                for ctrl in dialog_window.descendants():
                    try:
                        ctrl_class = ctrl.class_name() or ""
                        if "Edit" in ctrl_class:
                            ctrl_text = ctrl.window_text() or "(空)"
                            edits.append(ctrl)
                            print(f"    → Edit発見: '{ctrl_text}'", file=sys.stderr)
                    except:
                        pass

                print(f"  → Editコントロール数: {len(edits)}", file=sys.stderr)

                # 名称フィールドは通常最後のEditフィールド
                if edits:
                    name_field = edits[-1]
                    name_field.set_focus()
                    time.sleep(0.2)
                    # 既存のテキストをクリアしてファイル名を入力
                    name_field.type_keys("^a", set_foreground=False)  # Ctrl+A で全選択
                    time.sleep(0.1)
                    name_field.type_keys(self.output_filename, with_spaces=True, set_foreground=False)
                    print(f"  ✓ ファイル名を入力しました: {self.output_filename}", file=sys.stderr)
                else:
                    raise Exception("Editフィールドが見つかりません")

            except Exception as e:
                print(f"  → Edit検索失敗: {str(e)}", file=sys.stderr)
                print("  → キーボード操作でファイル名を入力します...", file=sys.stderr)

                # Tab移動で名称フィールドへ（ダイアログの構造に依存）
                # 出力形式 → 順序 → 更新日付 → 範囲(2つ) → 場所 → 名称
                for i in range(8):
                    keyboard.send_keys("{TAB}")
                    time.sleep(0.1)

                # ファイル名を入力
                keyboard.send_keys("^a")  # 全選択
                time.sleep(0.1)
                keyboard.send_keys(self.output_filename)
                print(f"  → キーボードでファイル名を入力しました: {self.output_filename}", file=sys.stderr)

            time.sleep(0.5)

            # OKボタンをクリック
            print("OKボタンをクリックしています...", file=sys.stderr)
            try:
                ok_button = dialog_window.child_window(title="OK")
                if ok_button.exists(timeout=2):
                    ok_button.click_input()
                    print("  ✓ OKボタンをクリックしました", file=sys.stderr)
                else:
                    keyboard.send_keys("{ENTER}")
                    print("  → Enterキーを送信しました", file=sys.stderr)
            except:
                keyboard.send_keys("{ENTER}")
                print("  → Enterキーを送信しました", file=sys.stderr)

            time.sleep(2.0)

            print("✓ エクスポートを実行しました", file=sys.stderr)
            return True

        except Exception as e:
            print(f"❌ ダイアログ操作エラー: {str(e)}", file=sys.stderr)
            import traceback
            traceback.print_exc(file=sys.stderr)
            return False

    def run(self):
        """自動化を実行"""
        start_time = time.time()

        try:
            # 工程1: 弥生販売に接続
            if not self.connect_to_yayoi():
                return {
                    'success': False,
                    'message': '弥生販売が起動していません。\n弥生販売を起動してから再実行してください。'
                }

            # 工程2: 台帳メニューから顧客台帳を開く
            if not self.navigate_to_customer_ledger():
                return {
                    'success': False,
                    'message': '顧客台帳を開けませんでした。\n\n他のダイアログや伝票ウィンドウが開いていないか確認してください。'
                }

            # 工程3: Excelボタンをクリック
            if not self.click_excel_button():
                return {
                    'success': False,
                    'message': 'Excelボタンのクリックに失敗しました。'
                }

            # 工程4: エクスポートダイアログを取得
            export_dialog = self.find_export_dialog()
            if not export_dialog:
                return {
                    'success': False,
                    'message': 'Excelへの書き出しダイアログが開きませんでした。'
                }

            # 工程5: ファイル名を設定してOK
            if not self.fill_export_dialog(export_dialog):
                return {
                    'success': False,
                    'message': 'エクスポートダイアログの操作に失敗しました。'
                }

            end_time = time.time()
            duration = end_time - start_time

            output_path = f"C:\\Users\\user\\Downloads\\{self.output_filename}.xls"
            return {
                'success': True,
                'message': f'顧客リストをエクスポートしました（{duration:.2f}秒）\n\n出力ファイル:\n{output_path}',
                'duration': duration,
                'output_file': output_path
            }

        except Exception as e:
            return {
                'success': False,
                'message': f'エラーが発生しました: {str(e)}'
            }

if __name__ == '__main__':
    automation = YayoiCustomerExportAutomation()
    result = automation.run()

    # 結果をJSON形式で出力
    print(json.dumps(result, ensure_ascii=False))
