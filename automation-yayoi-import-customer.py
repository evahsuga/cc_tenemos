# -*- coding: utf-8 -*-
"""
弥生販売26 顧客台帳インポート自動化
Step 6: 弥生販売のインポート画面（顧客台帳）まで自動でナビゲート
"""
from pywinauto import Application
from pywinauto.findwindows import ElementNotFoundError
import sys
import json
import time
import io

# 標準出力・標準エラー出力をUTF-8に設定（Windows文字化け対策）
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')

class YayoiCustomerImportAutomation:
    def __init__(self):
        self.app = None
        self.main_window = None

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
            # 1. 「管理者」を含むウィンドウ（最優先）
            # 2. 「プロフェッショナル」または「スタンダード」を含むウィンドウ
            # 3. 「売上伝票」「仕入伝票」などの業務ウィンドウは除外

            selected_window = None

            # 優先度1: 「管理者」を含むウィンドウ
            for window, title in yayoi_windows:
                if "管理者" in title and "伝票" not in title:
                    selected_window = (window, title)
                    print(f"  → メインウィンドウ（管理者）を選択: {title}", file=sys.stderr)
                    break

            # 優先度2: 「プロフェッショナル」を含むウィンドウ（伝票ではない）
            if not selected_window:
                for window, title in yayoi_windows:
                    if "プロフェッショナル" in title and "伝票" not in title:
                        selected_window = (window, title)
                        print(f"  → メインウィンドウ（プロフェッショナル）を選択: {title}", file=sys.stderr)
                        break

            # 優先度3: 「スタンダード」を含むウィンドウ（伝票ではない）
            if not selected_window:
                for window, title in yayoi_windows:
                    if "スタンダード" in title and "伝票" not in title:
                        selected_window = (window, title)
                        print(f"  → メインウィンドウ（スタンダード）を選択: {title}", file=sys.stderr)
                        break

            # 優先度4: 最初に見つかった弥生販売ウィンドウ（伝票ではない）
            if not selected_window:
                for window, title in yayoi_windows:
                    if "伝票" not in title:
                        selected_window = (window, title)
                        print(f"  → メインウィンドウ（デフォルト）を選択: {title}", file=sys.stderr)
                        break

            if not selected_window:
                print("❌ メインウィンドウを特定できませんでした", file=sys.stderr)
                return False

            self.main_window = selected_window[0]

            # Applicationオブジェクトを取得
            # ウィンドウから親プロセスに接続
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

    def navigate_to_import_menu(self):
        """インポートメニューまでナビゲート"""
        try:
            print("インポートメニューにナビゲートしています...", file=sys.stderr)

            # メニューバーから「ファイル」→「インポート」の順にアクセス
            # 弥生販売26のメニュー構造を想定

            # 方法1: メニューバーから選択
            # メインウィンドウをアクティブにする
            self.main_window.set_focus()
            time.sleep(0.35)

            # Alt+F でファイルメニューを開く
            print("ファイルメニューを開いています...", file=sys.stderr)
            self.main_window.type_keys("%f")  # Alt+F
            time.sleep(0.7)

            # 「インポート(I)」を選択（アクセスキーがIなのでIキーを押す）
            print("インポートメニューを選択しています...", file=sys.stderr)
            self.main_window.type_keys("i")  # I キー
            time.sleep(1.0)

            print("✓ インポートメニューを開きました", file=sys.stderr)
            return True

        except Exception as e:
            print(f"❌ ナビゲーションエラー: {str(e)}", file=sys.stderr)
            return False

    def select_ledger_import(self):
        """台帳インポート(A)を選択"""
        try:
            print("\n台帳インポート(A)を選択しています...", file=sys.stderr)

            # 「台帳インポート(A)」を選択（アクセスキーがAなのでAキーを押す）
            self.main_window.type_keys("a")  # A キー
            time.sleep(1.0)

            print("✓ 台帳インポートを選択しました", file=sys.stderr)
            return True

        except Exception as e:
            print(f"❌ 台帳インポート選択エラー: {str(e)}", file=sys.stderr)
            return False

    def find_dialog_window(self):
        """弥生販売プロセスの子ダイアログを探す"""
        dialog_window = None

        # 方法1: self.app.windows() でプロセス内のウィンドウを探す
        try:
            if self.app:
                all_windows = self.app.windows()
                print(f"  弥生販売プロセスのウィンドウ数: {len(all_windows)}", file=sys.stderr)

                for window in all_windows:
                    try:
                        if window.handle != self.main_window.handle:
                            title = window.window_text() or "(タイトルなし)"
                            class_name = window.class_name()
                            print(f"  → 子ウィンドウ発見: [{title}] (Class: {class_name})", file=sys.stderr)
                            if not dialog_window:
                                dialog_window = window
                                print(f"  → このウィンドウを使用します", file=sys.stderr)
                    except:
                        pass
        except Exception as e:
            print(f"  ⚠ プロセス内検索エラー: {str(e)}", file=sys.stderr)

        # 方法2: 見つからない場合、デスクトップから空タイトルのウィンドウを探す
        if not dialog_window:
            print("  プロセス内で見つからないため、デスクトップから検索...", file=sys.stderr)
            try:
                from pywinauto import Desktop
                desktop = Desktop(backend="uia")

                # 除外するクラス名のパターン（Windowsシステムウィンドウ）
                exclude_classes = [
                    "Shell_", "Progman", "WorkerW", "IME", "MSCTFIME",
                    "tooltips_", "TaskList", "Tray", "NotifyIcon"
                ]

                for window in desktop.windows():
                    try:
                        title = window.window_text()
                        class_name = window.class_name() or ""

                        # 空タイトルのウィンドウを探す
                        if title == "" or title is None:
                            # Shellやシステム系クラスは除外
                            is_excluded = any(exc in class_name for exc in exclude_classes)
                            if is_excluded:
                                print(f"  → 除外: 空タイトル (Class: {class_name})", file=sys.stderr)
                                continue

                            print(f"  → 空タイトルウィンドウ発見 (Class: {class_name})", file=sys.stderr)

                            # ダイアログっぽいクラス名かチェック
                            if class_name and ("Dialog" in class_name or "#32770" in class_name or "Window" in class_name):
                                dialog_window = window
                                print(f"  → このウィンドウを使用します（デスクトップ検索）", file=sys.stderr)
                                break
                            elif not dialog_window:
                                dialog_window = window
                                print(f"  → 候補として保持", file=sys.stderr)
                    except:
                        pass
            except Exception as e:
                print(f"  ⚠ デスクトップ検索エラー: {str(e)}", file=sys.stderr)

        return dialog_window

    def click_next_button(self, description=""):
        """次へ（N）ボタンをクリック（グローバルキー送信）"""
        try:
            print(f"\n次へボタンをクリックしています... ({description})", file=sys.stderr)

            # Alt+N で次へボタンを押す（グローバルにキー送信）
            import pywinauto.keyboard as keyboard
            keyboard.send_keys("%n")
            print(f"  → Alt+Nを送信しました", file=sys.stderr)

            time.sleep(1.4)

            print("✓ 次へボタンをクリックしました", file=sys.stderr)
            return True

        except Exception as e:
            print(f"❌ 次へボタンクリックエラー: {str(e)}", file=sys.stderr)
            import traceback
            traceback.print_exc(file=sys.stderr)
            return False

    def select_ledger_import_option(self):
        """台帳のインポート（2）を選択"""
        try:
            print("\n台帳のインポート（2）を選択しています...", file=sys.stderr)

            # ラジオボタン「台帳のインポート(2)」を選択
            # アクセスキーが2なので、2キーを押す
            import pywinauto.keyboard as keyboard
            keyboard.send_keys("2")
            print(f"  → 2キーを送信しました", file=sys.stderr)

            time.sleep(0.7)

            print("✓ 台帳のインポート（2）を選択しました", file=sys.stderr)
            return True

        except Exception as e:
            print(f"❌ 台帳のインポート選択エラー: {str(e)}", file=sys.stderr)
            import traceback
            traceback.print_exc(file=sys.stderr)
            return False

    def wait_for_dialog(self):
        """ダイアログが開くまで待機"""
        print("\n台帳インポートダイアログを確認しています...", file=sys.stderr)

        # インポートダイアログが開くまで待機
        time.sleep(1.4)

        # 弥生販売プロセスの子ウィンドウからダイアログを探す
        dialog_window = self.find_dialog_window()

        if dialog_window:
            title = dialog_window.window_text() or "(タイトルなし)"
            class_name = dialog_window.class_name() or "(不明)"
            print(f"✓ ダイアログを検出: {title} (Class: {class_name})", file=sys.stderr)
            return True
        else:
            print("⚠ ダイアログ未検出（キー操作で続行します）", file=sys.stderr)
            return True  # ダイアログが見つからなくてもキー操作で続行

    def open_customer_import_dialog(self):
        """顧客台帳インポートダイアログを開く"""
        try:
            print("\n顧客台帳インポートダイアログを確認しています...", file=sys.stderr)

            # インポートダイアログが開くまで待機
            time.sleep(1.4)

            # 弥生販売プロセスの子ウィンドウからダイアログを探す
            dialog_window = self.find_dialog_window()

            if dialog_window:
                title = dialog_window.window_text() or "(タイトルなし)"
                print(f"✓ インポートダイアログを開きました: {title}", file=sys.stderr)

                # ダイアログの情報を出力
                print("\n=== インポートダイアログ情報 ===", file=sys.stderr)
                print(f"タイトル: {title}", file=sys.stderr)
                print(f"クラス名: {dialog_window.class_name()}", file=sys.stderr)

                # ダイアログにフォーカスを移す
                dialog_window.set_focus()
                time.sleep(0.35)

                return True
            else:
                print("⚠ インポートダイアログが見つかりませんでした", file=sys.stderr)
                print("キー操作で続行を試みます...", file=sys.stderr)
                # ダイアログが見つからなくてもキー操作で続行可能
                return True

        except Exception as e:
            print(f"❌ ダイアログオープンエラー: {str(e)}", file=sys.stderr)
            return False

    def print_window_info(self):
        """デバッグ用：ウィンドウ情報を出力"""
        try:
            print("\n=== 弥生販売 ウィンドウ情報 ===", file=sys.stderr)
            print(f"タイトル: {self.main_window.window_text()}", file=sys.stderr)
            print(f"クラス名: {self.main_window.class_name()}", file=sys.stderr)

            # 利用可能なメニューを確認
            print("\n=== メニューバー情報 ===", file=sys.stderr)
            try:
                menu_bar = self.main_window.menu_bar()
                if menu_bar:
                    print("メニューバーが見つかりました", file=sys.stderr)
                    # メニュー項目を列挙
                    menu_items = menu_bar.items()
                    for i, item in enumerate(menu_items):
                        print(f"  メニュー {i}: {item}", file=sys.stderr)
            except Exception as e:
                print(f"メニューバー取得エラー: {str(e)}", file=sys.stderr)

            print("", file=sys.stderr)

        except Exception as e:
            print(f"ウィンドウ情報取得エラー: {str(e)}", file=sys.stderr)

    def run(self):
        """自動化を実行"""
        start_time = time.time()

        try:
            # 工程1: 弥生販売に接続
            if not self.connect_to_yayoi():
                return {
                    'success': False,
                    'message': '弥生販売が起動していません。\n営業時間中は弥生販売を起動しておいてください。'
                }

            # デバッグ用：ウィンドウ情報を出力
            self.print_window_info()

            # 工程2: インポートメニューまでナビゲート
            if not self.navigate_to_import_menu():
                return {
                    'success': False,
                    'message': 'インポートメニューへのナビゲーションに失敗しました。'
                }

            # 工程3: 台帳インポート(A)を選択
            if not self.select_ledger_import():
                return {
                    'success': False,
                    'message': '台帳インポートの選択に失敗しました。'
                }

            # 工程4: 顧客台帳インポートダイアログを開く
            if not self.open_customer_import_dialog():
                return {
                    'success': False,
                    'message': '顧客台帳インポートダイアログを開けませんでした。'
                }

            # 工程5: 次へボタンをクリック（1回目）
            if not self.click_next_button("インポート種別選択画面"):
                return {
                    'success': False,
                    'message': '次へボタン（1回目）のクリックに失敗しました。'
                }

            # 工程6: 台帳のインポート（2）を選択
            if not self.select_ledger_import_option():
                return {
                    'success': False,
                    'message': '台帳のインポート（2）の選択に失敗しました。'
                }

            # 工程7: 次へボタンをクリック（2回目）
            if not self.click_next_button("台帳種別選択画面"):
                return {
                    'success': False,
                    'message': '次へボタン（2回目）のクリックに失敗しました。'
                }

            end_time = time.time()
            duration = end_time - start_time

            return {
                'success': True,
                'message': f'顧客台帳インポート設定完了（{duration:.2f}秒）\n\n次のステップ: CSVファイルを選択してインポートを実行してください。',
                'duration': duration
            }

        except Exception as e:
            return {
                'success': False,
                'message': f'エラーが発生しました: {str(e)}'
            }

if __name__ == '__main__':
    automation = YayoiCustomerImportAutomation()
    result = automation.run()

    # 結果をJSON形式で出力
    print(json.dumps(result, ensure_ascii=False))
