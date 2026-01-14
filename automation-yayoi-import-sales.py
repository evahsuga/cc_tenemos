# -*- coding: utf-8 -*-
"""
弥生販売26 売上伝票インポート自動化
Step 7: 弥生販売のインポート画面（売上伝票）まで自動でナビゲート
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

class YayoiSalesImportAutomation:
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

    def select_transaction_import(self):
        """取引インポート(B)を選択"""
        try:
            print("\n取引インポート(B)を選択しています...", file=sys.stderr)

            # 「取引インポート(B)」を選択（アクセスキーがBなのでBキーを押す）
            self.main_window.type_keys("b")  # B キー
            time.sleep(2.0)  # ダイアログが開くまで待機（1.5秒→2.0秒に延長）

            print("✓ 取引インポートを選択しました", file=sys.stderr)

            # ダイアログが開くまで追加で待機
            print("  ダイアログが開くまで待機中...", file=sys.stderr)
            time.sleep(1.5)

            return True

        except Exception as e:
            print(f"❌ 取引インポート選択エラー: {str(e)}", file=sys.stderr)
            return False

    def click_next_button(self, dialog_title=""):
        """次へ（N）ボタンをクリック"""
        try:
            print(f"\n次へボタンをクリックしています... ({dialog_title})", file=sys.stderr)

            # ダイアログを探してフォーカスを移す
            dialog_window = None
            try:
                from pywinauto import Desktop
                desktop = Desktop(backend="uia")

                # インポートウィザードを探す
                for window in desktop.windows():
                    try:
                        title = window.window_text()
                        if "インポート" in title or "ウィザード" in title:
                            print(f"  → ダイアログ発見: {title}", file=sys.stderr)
                            dialog_window = window
                            break
                    except:
                        pass

                if not dialog_window:
                    print(f"  ⚠ ダイアログが見つかりません。メインウィンドウに送信します。", file=sys.stderr)
            except Exception as e:
                print(f"  ⚠ ダイアログ検索エラー: {str(e)}", file=sys.stderr)

            # ダイアログが見つかった場合はダイアログに、見つからない場合は単にキー送信
            if dialog_window:
                # ダイアログにフォーカスを移す
                dialog_window.set_focus()
                time.sleep(0.5)
                # Alt+N で次へボタンを押す
                dialog_window.type_keys("%n")
                print(f"  → ダイアログにAlt+Nを送信しました", file=sys.stderr)
            else:
                # ダイアログが見つからない場合、キーボードイベントを直接送信
                import pywinauto.keyboard as keyboard
                keyboard.send_keys("%n")
                print(f"  → グローバルにAlt+Nを送信しました", file=sys.stderr)

            time.sleep(2.0)

            print("✓ 次へボタンをクリックしました", file=sys.stderr)
            return True

        except Exception as e:
            print(f"❌ 次へボタンクリックエラー: {str(e)}", file=sys.stderr)
            import traceback
            traceback.print_exc(file=sys.stderr)
            return False

    def select_slip_import_option(self):
        """伝票インポート（１）を選択"""
        try:
            print("\n伝票インポート（１）を選択しています...", file=sys.stderr)

            # キーボードで「1」を押して選択
            self.main_window.type_keys("1")
            time.sleep(1.0)

            print("✓ 伝票インポート（１）を選択しました", file=sys.stderr)
            return True

        except Exception as e:
            print(f"❌ 伝票インポート選択エラー: {str(e)}", file=sys.stderr)
            return False

    def select_sales_slip(self):
        """売上伝票を選択"""
        try:
            print("\n売上伝票を選択しています...", file=sys.stderr)

            # ＜インポートする伝票（D）＞のコンボボックスにフォーカスを移動
            # Alt+D でコンボボックスにアクセス
            self.main_window.type_keys("%d")
            time.sleep(0.5)

            # 「売上伝票」を探す（リストの最初にあると仮定）
            # 下矢印キーで選択を移動して「売上伝票」を探す
            # まず、Homeキーでリストの最初に移動
            self.main_window.type_keys("{HOME}")
            time.sleep(0.3)

            # 売上伝票を選択（リストの最初の項目と仮定）
            self.main_window.type_keys("{ENTER}")
            time.sleep(1.0)

            print("✓ 売上伝票を選択しました", file=sys.stderr)
            return True

        except Exception as e:
            print(f"❌ 売上伝票選択エラー: {str(e)}", file=sys.stderr)
            return False

    def debug_print_current_dialog(self):
        """デバッグ用：現在のダイアログ情報を出力"""
        try:
            print("\n=== 現在開いているウィンドウを調査 ===", file=sys.stderr)
            from pywinauto import Desktop
            desktop = Desktop(backend="uia")
            windows = desktop.windows()

            print(f"全ウィンドウ数: {len(windows)}", file=sys.stderr)
            for i, win in enumerate(windows[:15]):  # 最初の15個
                try:
                    title = win.window_text()
                    if title and ("インポート" in title or "ウィザード" in title or "弥生" in title):
                        print(f"  {i+1}. {title}", file=sys.stderr)
                        # ダイアログのコントロールを表示
                        try:
                            print(f"     コントロール一覧:", file=sys.stderr)
                            win.print_control_identifiers(depth=2, filename=None)
                        except:
                            pass
                except:
                    pass

        except Exception as e:
            print(f"デバッグ情報出力エラー: {str(e)}", file=sys.stderr)

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

            # 工程2: インポートメニューまでナビゲート（ファイル → インポート）
            if not self.navigate_to_import_menu():
                return {
                    'success': False,
                    'message': 'インポートメニューへのナビゲーションに失敗しました。'
                }

            # 工程3: 取引インポート(B)を選択
            if not self.select_transaction_import():
                return {
                    'success': False,
                    'message': '取引インポートの選択に失敗しました。'
                }

            # デバッグ用：現在のダイアログ情報を出力
            self.debug_print_current_dialog()

            # 工程4: 次へ（N）ボタンをクリック（1回目）
            if not self.click_next_button("取引インポート選択後"):
                return {
                    'success': False,
                    'message': '次へボタン（1回目）のクリックに失敗しました。'
                }

            # デバッグ用：現在のダイアログ情報を出力
            self.debug_print_current_dialog()

            # 工程5: 伝票インポート（１）を選択
            if not self.select_slip_import_option():
                return {
                    'success': False,
                    'message': '伝票インポート（１）の選択に失敗しました。'
                }

            # 工程6: 次へ（N）ボタンをクリック（2回目）
            if not self.click_next_button("伝票インポート選択後"):
                return {
                    'success': False,
                    'message': '次へボタン（2回目）のクリックに失敗しました。'
                }

            # デバッグ用：現在のダイアログ情報を出力
            self.debug_print_current_dialog()

            # 工程7: 売上伝票を選択
            if not self.select_sales_slip():
                return {
                    'success': False,
                    'message': '売上伝票の選択に失敗しました。'
                }

            end_time = time.time()
            duration = end_time - start_time

            return {
                'success': True,
                'message': f'売上伝票インポート設定完了（{duration:.2f}秒）\n\n次のステップ: CSVファイルを選択してインポートを実行してください。',
                'duration': duration
            }

        except Exception as e:
            return {
                'success': False,
                'message': f'エラーが発生しました: {str(e)}'
            }

if __name__ == '__main__':
    automation = YayoiSalesImportAutomation()
    result = automation.run()

    # 結果をJSON形式で出力
    print(json.dumps(result, ensure_ascii=False))
