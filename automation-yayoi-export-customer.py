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
            selected_window = None

            # 優先度1: 「管理者」を含むウィンドウ
            for window, title in yayoi_windows:
                if "管理者" in title and "伝票" not in title and "台帳" not in title:
                    selected_window = (window, title)
                    print(f"  → メインウィンドウ（管理者）を選択: {title}", file=sys.stderr)
                    break

            # 優先度2: 「プロフェッショナル」を含むウィンドウ
            if not selected_window:
                for window, title in yayoi_windows:
                    if "プロフェッショナル" in title and "伝票" not in title and "台帳" not in title:
                        selected_window = (window, title)
                        print(f"  → メインウィンドウ（プロフェッショナル）を選択: {title}", file=sys.stderr)
                        break

            # 優先度3: 「スタンダード」を含むウィンドウ
            if not selected_window:
                for window, title in yayoi_windows:
                    if "スタンダード" in title and "伝票" not in title and "台帳" not in title:
                        selected_window = (window, title)
                        print(f"  → メインウィンドウ（スタンダード）を選択: {title}", file=sys.stderr)
                        break

            # 優先度4: 最初に見つかった弥生販売ウィンドウ
            if not selected_window:
                for window, title in yayoi_windows:
                    if "伝票" not in title and "台帳" not in title:
                        selected_window = (window, title)
                        print(f"  → メインウィンドウ（デフォルト）を選択: {title}", file=sys.stderr)
                        break

            if not selected_window:
                print("❌ メインウィンドウを特定できませんでした", file=sys.stderr)
                return False

            self.main_window = selected_window[0]

            # Applicationオブジェクトを取得
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

    def navigate_to_customer_ledger(self):
        """台帳メニューから顧客台帳を開く"""
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

        except Exception as e:
            print(f"❌ 顧客台帳オープンエラー: {str(e)}", file=sys.stderr)
            import traceback
            traceback.print_exc(file=sys.stderr)
            return False

    def find_customer_ledger_window(self):
        """得意先台帳ウィンドウを探す"""
        try:
            print("\n得意先台帳ウィンドウを探しています...", file=sys.stderr)
            time.sleep(1.0)

            # プロセス内のウィンドウを探す
            if self.app:
                all_windows = self.app.windows()
                print(f"  弥生販売プロセスのウィンドウ数: {len(all_windows)}", file=sys.stderr)

                for window in all_windows:
                    try:
                        title = window.window_text() or "(タイトルなし)"
                        print(f"  → ウィンドウ: {title}", file=sys.stderr)
                        if "得意先台帳" in title:
                            print(f"  ✓ 得意先台帳ウィンドウを発見: {title}", file=sys.stderr)
                            return window
                    except:
                        pass

            print("⚠ 得意先台帳ウィンドウが見つかりません", file=sys.stderr)
            return None

        except Exception as e:
            print(f"❌ ウィンドウ検索エラー: {str(e)}", file=sys.stderr)
            return None

    def click_excel_button(self, ledger_window):
        """Excelボタンをクリック"""
        try:
            print("\nExcelボタンをクリックしています...", file=sys.stderr)

            # 得意先台帳ウィンドウをアクティブにする
            ledger_window.set_focus()
            time.sleep(0.35)

            # 方法1: ツールバーからExcelボタンを探してクリック
            try:
                # ボタンを名前で検索
                excel_button = ledger_window.child_window(title="Excel", control_type="Button")
                if excel_button.exists():
                    print("  → Excelボタンを発見（Button検索）", file=sys.stderr)
                    excel_button.click()
                    time.sleep(1.0)
                    print("✓ Excelボタンをクリックしました", file=sys.stderr)
                    return True
            except Exception as e:
                print(f"  → Button検索失敗: {str(e)}", file=sys.stderr)

            # 方法2: ToolBarからExcelボタンを探す
            try:
                toolbar = ledger_window.child_window(control_type="ToolBar")
                if toolbar.exists():
                    print("  → ツールバーを発見", file=sys.stderr)
                    # ツールバー内のボタンを探す
                    buttons = toolbar.children(control_type="Button")
                    for btn in buttons:
                        btn_name = btn.window_text()
                        print(f"    → ボタン: {btn_name}", file=sys.stderr)
                        if "Excel" in btn_name:
                            btn.click()
                            time.sleep(1.0)
                            print("✓ Excelボタンをクリックしました", file=sys.stderr)
                            return True
            except Exception as e:
                print(f"  → ToolBar検索失敗: {str(e)}", file=sys.stderr)

            # 方法3: すべてのコントロールを探索
            try:
                print("  → 全コントロールを探索中...", file=sys.stderr)
                all_controls = ledger_window.descendants()
                for ctrl in all_controls:
                    try:
                        ctrl_name = ctrl.window_text()
                        ctrl_type = ctrl.control_type()
                        if ctrl_name and "Excel" in ctrl_name:
                            print(f"    → Excel関連コントロール発見: {ctrl_name} ({ctrl_type})", file=sys.stderr)
                            if ctrl_type in ["Button", "MenuItem", "ToolBar"]:
                                ctrl.click()
                                time.sleep(1.0)
                                print("✓ Excelボタンをクリックしました", file=sys.stderr)
                                return True
                    except:
                        pass
            except Exception as e:
                print(f"  → 全探索失敗: {str(e)}", file=sys.stderr)

            # 方法4: Tab移動でExcelボタンにフォーカスを移動
            print("  → Tab移動でExcelボタンを探します...", file=sys.stderr)
            # ツールバーの位置を推定（スクリーンショットから約7番目のボタン）
            # 戻る, 進む, 新規作成, コード付番, 削除, 参照, ウィザード, Excel の順
            for i in range(15):
                ledger_window.type_keys("{TAB}")
                time.sleep(0.1)
            ledger_window.type_keys("{ENTER}")
            time.sleep(1.0)
            print("✓ Tab移動でExcelボタンをクリック試行", file=sys.stderr)
            return True

        except Exception as e:
            print(f"❌ Excelボタンクリックエラー: {str(e)}", file=sys.stderr)
            import traceback
            traceback.print_exc(file=sys.stderr)
            return False

    def find_export_dialog(self):
        """Excelへの書き出しダイアログを探す"""
        try:
            print("\n「Excelへの書き出し」ダイアログを探しています...", file=sys.stderr)
            time.sleep(1.0)

            # プロセス内のウィンドウを探す
            if self.app:
                all_windows = self.app.windows()
                for window in all_windows:
                    try:
                        title = window.window_text() or ""
                        if "Excel" in title or "書き出し" in title:
                            print(f"  ✓ エクスポートダイアログを発見: {title}", file=sys.stderr)
                            return window
                    except:
                        pass

            # デスクトップからも検索
            from pywinauto import Desktop
            desktop = Desktop(backend="uia")
            for window in desktop.windows():
                try:
                    title = window.window_text() or ""
                    if "Excel" in title and "書き出し" in title:
                        print(f"  ✓ エクスポートダイアログを発見（デスクトップ）: {title}", file=sys.stderr)
                        return window
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
            time.sleep(0.35)

            # 名称フィールドに移動（Alt+S または Tab）
            # スクリーンショットより「出力先(S)」セクションの「名称」フィールド
            import pywinauto.keyboard as keyboard

            # 方法1: Alt+S で出力先セクションにフォーカス（機能しない可能性）
            # 方法2: Tab移動で名称フィールドに到達
            # ダイアログの構造: 出力形式 → 出力条件 → 出力先（場所、名称）→ ボタン

            # 名称フィールドにフォーカスを移動
            # 「名称」のエディットボックスを探す
            try:
                name_edit = dialog_window.child_window(control_type="Edit")
                edits = dialog_window.children(control_type="Edit")
                print(f"  → Editコントロール数: {len(edits)}", file=sys.stderr)
                for i, edit in enumerate(edits):
                    edit_name = edit.window_text()
                    print(f"    → Edit[{i}]: '{edit_name}'", file=sys.stderr)

                # 最後のEditが名称フィールドの可能性が高い
                if len(edits) >= 1:
                    name_field = edits[-1]  # 最後のEditフィールド
                    name_field.set_focus()
                    time.sleep(0.2)
                    # 既存のテキストをクリアしてファイル名を入力
                    name_field.type_keys("^a")  # Ctrl+A で全選択
                    time.sleep(0.1)
                    name_field.type_keys(self.output_filename, with_spaces=True)
                    print(f"  ✓ ファイル名を入力しました: {self.output_filename}", file=sys.stderr)
            except Exception as e:
                print(f"  → Edit検索失敗、Tab移動を試行: {str(e)}", file=sys.stderr)
                # Tab移動で名称フィールドへ
                for i in range(10):
                    keyboard.send_keys("{TAB}")
                    time.sleep(0.1)
                keyboard.send_keys("^a")
                time.sleep(0.1)
                keyboard.send_keys(self.output_filename)
                print(f"  → Tab移動でファイル名を入力しました", file=sys.stderr)

            time.sleep(0.5)

            # OKボタンをクリック（Enterキー）
            print("OKボタンをクリックしています...", file=sys.stderr)
            keyboard.send_keys("{ENTER}")
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
                    'message': '顧客台帳を開けませんでした。'
                }

            # 工程3: 得意先台帳ウィンドウを取得
            ledger_window = self.find_customer_ledger_window()
            if not ledger_window:
                # ウィンドウが見つからなくても続行（キー操作で対応）
                print("⚠ 得意先台帳ウィンドウが見つかりませんが続行します", file=sys.stderr)

            # === Phase 1-A ここまで ===
            # 以下は Phase 1-B, 1-C で実装

            end_time = time.time()
            duration = end_time - start_time

            return {
                'success': True,
                'message': f'顧客台帳を開きました（{duration:.2f}秒）\n\n[Phase 1-A 完了] 次のステップ: Excelボタンクリックを実装',
                'duration': duration,
                'phase': '1-A'
            }

            # === Phase 1-B: Excelボタンクリック ===
            # if ledger_window:
            #     if not self.click_excel_button(ledger_window):
            #         return {
            #             'success': False,
            #             'message': 'Excelボタンのクリックに失敗しました。'
            #         }
            #
            # # 工程4: エクスポートダイアログを取得
            # export_dialog = self.find_export_dialog()
            # if not export_dialog:
            #     return {
            #         'success': False,
            #         'message': 'エクスポートダイアログが開きませんでした。'
            #     }
            #
            # === Phase 1-C: ダイアログ操作 ===
            # # 工程5: ファイル名を設定してOK
            # if not self.fill_export_dialog(export_dialog):
            #     return {
            #         'success': False,
            #         'message': 'エクスポートダイアログの操作に失敗しました。'
            #     }
            #
            # end_time = time.time()
            # duration = end_time - start_time
            #
            # output_path = f"C:\\Users\\user\\Downloads\\{self.output_filename}.xls"
            # return {
            #     'success': True,
            #     'message': f'顧客リストをエクスポートしました（{duration:.2f}秒）\n\n出力ファイル:\n{output_path}',
            #     'duration': duration,
            #     'output_file': output_path
            # }

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
