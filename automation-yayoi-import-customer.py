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
        """弥生販売に接続"""
        try:
            print("弥生販売に接続しています...", file=sys.stderr)
            # 既に起動している弥生販売に接続
            # メインウィンドウを特定するため「プロフェッショナル」または「スタンダード」を含む条件にする
            # または、より具体的に会社名（管理者）を含むウィンドウを探す
            try:
                # まず、プロフェッショナル版を探す
                self.app = Application(backend="uia").connect(title_re=".*弥生販売.*プロフェッショナル.*", timeout=5)
                self.main_window = self.app.window(title_re=".*弥生販売.*プロフェッショナル.*")
            except:
                # 見つからなければスタンダード版を探す
                try:
                    self.app = Application(backend="uia").connect(title_re=".*弥生販売.*スタンダード.*", timeout=5)
                    self.main_window = self.app.window(title_re=".*弥生販売.*スタンダード.*")
                except:
                    # それでも見つからなければ「管理者」を含むウィンドウを探す
                    self.app = Application(backend="uia").connect(title_re=".*弥生販売.*管理者.*", timeout=5)
                    self.main_window = self.app.window(title_re=".*弥生販売.*管理者.*")

            print(f"✓ 弥生販売に接続しました: {self.main_window.window_text()}", file=sys.stderr)
            return True
        except ElementNotFoundError:
            print("❌ 弥生販売が起動していません", file=sys.stderr)
            return False
        except Exception as e:
            print(f"❌ 接続エラー: {str(e)}", file=sys.stderr)
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
            time.sleep(0.5)

            # Alt+F でファイルメニューを開く
            print("ファイルメニューを開いています...", file=sys.stderr)
            self.main_window.type_keys("%f")  # Alt+F
            time.sleep(1.0)

            # 「インポート(I)」を選択（アクセスキーがIなのでIキーを押す）
            print("インポートメニューを選択しています...", file=sys.stderr)
            self.main_window.type_keys("i")  # I キー
            time.sleep(1.5)

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
            time.sleep(1.5)

            print("✓ 台帳インポートを選択しました", file=sys.stderr)
            return True

        except Exception as e:
            print(f"❌ 台帳インポート選択エラー: {str(e)}", file=sys.stderr)
            return False

    def open_customer_import_dialog(self):
        """顧客台帳インポートダイアログを開く"""
        try:
            print("\n顧客台帳インポートダイアログを確認しています...", file=sys.stderr)

            # インポートダイアログが開くまで待機
            time.sleep(2.0)

            # インポートダイアログが開いたか確認
            try:
                import_dialog = self.app.window(title_re=".*インポート.*", timeout=5)
                print(f"✓ インポートダイアログを開きました: {import_dialog.window_text()}", file=sys.stderr)

                # ダイアログの情報を出力（次のステップの実装のため）
                print("\n=== インポートダイアログ情報 ===", file=sys.stderr)
                print(f"タイトル: {import_dialog.window_text()}", file=sys.stderr)
                print(f"クラス名: {import_dialog.class_name()}", file=sys.stderr)

                # ダイアログ内のコントロールを列挙
                try:
                    print("\n=== ダイアログ内のコントロール ===", file=sys.stderr)
                    import_dialog.print_control_identifiers(depth=2, filename=None)
                except Exception as e:
                    print(f"コントロール列挙エラー: {str(e)}", file=sys.stderr)

                return True
            except:
                print("❌ インポートダイアログが見つかりませんでした", file=sys.stderr)
                print("開いているウィンドウを確認します...", file=sys.stderr)

                # 全てのウィンドウを列挙
                try:
                    from pywinauto import Desktop
                    desktop = Desktop(backend="uia")
                    windows = desktop.windows()
                    print(f"\n現在開いているウィンドウ（{len(windows)}個）:", file=sys.stderr)
                    for i, win in enumerate(windows[:10]):  # 最初の10個だけ表示
                        try:
                            print(f"  {i+1}. {win.window_text()}", file=sys.stderr)
                        except:
                            pass
                except Exception as e:
                    print(f"ウィンドウ列挙エラー: {str(e)}", file=sys.stderr)

                return False

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
                    'message': '顧客台帳インポートダイアログを開けませんでした。\n\n現在は開発中のため、弥生販売のメニュー構造を調査しています。'
                }

            end_time = time.time()
            duration = end_time - start_time

            return {
                'success': True,
                'message': f'顧客台帳インポート画面を開きました（{duration:.2f}秒）',
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
