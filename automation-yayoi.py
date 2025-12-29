# -*- coding: utf-8 -*-
from pywinauto import Application
import sys
import json
import time

class YayoiAutomation:
    def __init__(self):
        self.app = None
        self.main_window = None

    def connect(self):
        """弥生販売に接続"""
        try:
            # 既に起動している弥生販売に接続
            # ※実際のタイトルに変更してください
            self.app = Application(backend="uia").connect(title_re=".*弥生販売.*")
            self.main_window = self.app.window(title_re=".*弥生販売.*")
            return True
        except Exception as e:
            print(f"エラー: 弥生販売が起動していません - {str(e)}", file=sys.stderr)
            return False

    def open_search(self):
        """検索画面を開く"""
        print("検索画面を開く...")

        # Ctrl+F で検索画面を開く
        self.main_window.type_keys("^f")
        time.sleep(0.5)

    def input_customer_code(self, customer_code):
        """顧客コードを入力"""
        print(f"顧客コード {customer_code} を入力...")

        # 検索ダイアログを取得
        # ※実際のタイトルに変更してください
        search_dialog = self.app.window(title_re=".*検索.*")

        # 顧客コード入力欄に入力
        # ※実際の要素名に変更してください
        search_dialog.child_window(auto_id="customerCodeEdit").set_text(customer_code)
        time.sleep(0.3)

    def execute_search(self):
        """検索を実行"""
        print("検索実行...")

        search_dialog = self.app.window(title_re=".*検索.*")

        # 検索ボタンをクリック
        # ※実際のボタン名に変更してください
        search_dialog.child_window(title="検索").click()
        time.sleep(0.5)

    def run(self, customer_code):
        """自動化を実行"""
        start_time = time.time()

        try:
            # 弥生販売に接続
            if not self.connect():
                return {
                    'success': False,
                    'message': '弥生販売が起動していません'
                }

            # 工程1: 検索画面を開く
            self.open_search()

            # 工程2: 顧客コードを入力
            self.input_customer_code(customer_code)

            # 工程3: 検索実行
            self.execute_search()

            end_time = time.time()
            duration = end_time - start_time

            return {
                'success': True,
                'message': f'顧客 {customer_code} を検索しました（{duration:.2f}秒）',
                'duration': duration
            }

        except Exception as e:
            return {
                'success': False,
                'message': f'エラー: {str(e)}'
            }

if __name__ == '__main__':
    # コマンドライン引数から顧客コードを取得
    if len(sys.argv) < 2:
        print(json.dumps({'success': False, 'message': '顧客コードが指定されていません'}))
        sys.exit(1)

    customer_code = sys.argv[1]

    automation = YayoiAutomation()
    result = automation.run(customer_code)

    # 結果をJSON形式で出力
    print(json.dumps(result, ensure_ascii=False))
