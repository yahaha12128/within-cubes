"use strict";

/*
 * 桌面渲染层（WorkerW 全屏层）语言包。
 * 键仍是界面里的中文原文，值依次对应 zh-TW / en / ja / fr / ru。
 * 只有全屏层组件会用到、主窗口没有的文案才放这里；
 * 主窗口语言包里已有的（组件名称、分类名等）直接复用，避免两套译名打架。
 */
(() => {
  const ENTRIES = {
    // ---------- 组件外框 / 窗口操作 ----------
    "拖动这里移动小组件": ["拖曳這裡移動小元件", "Drag here to move the widget", "ここをドラッグしてウィジェットを移動", "Faites glisser ici pour déplacer le widget", "Перетащите здесь, чтобы переместить виджет"],
    "拖动这里移动标签组": ["拖曳這裡移動標籤組", "Drag here to move the tab group", "ここをドラッグしてタブグループを移動", "Faites glisser ici pour déplacer le groupe d'onglets", "Перетащите здесь, чтобы переместить группу вкладок"],
    "拖动调整大小": ["拖曳調整大小", "Drag to resize", "ドラッグしてサイズ変更", "Faites glisser pour redimensionner", "Перетащите, чтобы изменить размер"],
    "拖动四边或四角调整大小": ["拖曳四邊或四角調整大小", "Drag an edge or corner to resize", "辺や角をドラッグしてサイズ変更", "Faites glisser un bord ou un coin pour redimensionner", "Перетащите край или угол, чтобы изменить размер"],
    "整理分类": ["整理分類", "Organized", "整理分類", "Fichiers classés", "Разобранные файлы"],
    "已锁定": ["已鎖定", "Locked", "ロック中", "Verrouillé", "Заблокировано"],
    "锁定小组件": ["鎖定小元件", "Lock widget", "ウィジェットをロック", "Verrouiller le widget", "Заблокировать виджет"],
    "恢复默认大小": ["恢復預設大小", "Reset size", "既定のサイズに戻す", "Rétablir la taille", "Сбросить размер"],
    "关闭小组件": ["關閉小元件", "Close widget", "ウィジェットを閉じる", "Fermer le widget", "Закрыть виджет"],
    "关闭组件": ["關閉元件", "Close widget", "ウィジェットを閉じる", "Fermer le widget", "Закрыть виджет"],
    "展开组件": ["展開元件", "Expand widget", "ウィジェットを展開", "Déployer le widget", "Развернуть виджет"],
    "收起组件": ["收合元件", "Collapse widget", "ウィジェットを折りたたむ", "Replier le widget", "Свернуть виджет"],
    "双击展开": ["雙擊展開", "Double-click to expand", "ダブルクリックで展開", "Double-clic pour déployer", "Двойной щелчок, чтобы развернуть"],
    "悬停展开": ["滑鼠移入展開", "Expand on hover", "ホバーで展開", "Déployer au survol", "Раскрывать при наведении"],
    "暂无文件": ["暫無檔案", "No files", "ファイルなし", "Aucun fichier", "Нет файлов"],
    "松开移入": ["放開以移入", "Drop to move in", "ドロップして移動", "Relâchez pour déplacer", "Отпустите, чтобы переместить"],
    "双击重命名": ["雙擊重新命名", "Double-click to rename", "ダブルクリックで名前変更", "Double-clic pour renommer", "Двойной щелчок, чтобы переименовать"],
    "刷新文件": ["重新整理檔案", "Refresh files", "ファイルを更新", "Actualiser les fichiers", "Обновить файлы"],
    "文件排序": ["檔案排序", "Sort files", "ファイルの並び替え", "Trier les fichiers", "Сортировка файлов"],
    "按名称排序": ["依名稱排序", "Sort by name", "名前順", "Trier par nom", "По имени"],
    "按修改时间排序": ["依修改時間排序", "Sort by modified time", "更新日時順", "Trier par date", "По дате изменения"],
    "按文件大小排序": ["依檔案大小排序", "Sort by size", "サイズ順", "Trier par taille", "По размеру"],

    // ---------- 标签组 ----------
    "标签组": ["標籤組", "Tab group", "タブグループ", "Groupe d'onglets", "Группа вкладок"],
    "拆分标签组": ["拆分標籤組", "Split tab group", "タブグループを分割", "Séparer le groupe d'onglets", "Разделить группу вкладок"],
    "拆分": ["拆分", "Split", "分割", "Séparer", "Разделить"],
    "标签组中的分类": ["標籤組中的分類", "Categories in this group", "グループ内の分類", "Catégories du groupe", "Категории в группе"],

    // ---------- 时钟 ----------
    "星期—": ["星期—", "Weekday", "曜日", "Jour", "День недели"],
    "祝你开心！": ["祝你開心！", "Have a lovely day!", "よい一日を！", "Bonne journée !", "Хорошего дня!"],
    "星期一": ["星期一", "Monday", "月曜日", "lundi", "Понедельник"],
    "星期二": ["星期二", "Tuesday", "火曜日", "mardi", "Вторник"],
    "星期三": ["星期三", "Wednesday", "水曜日", "mercredi", "Среда"],
    "星期四": ["星期四", "Thursday", "木曜日", "jeudi", "Четверг"],
    "星期五": ["星期五", "Friday", "金曜日", "vendredi", "Пятница"],
    "星期六": ["星期六", "Saturday", "土曜日", "samedi", "Суббота"],
    "星期日": ["星期日", "Sunday", "日曜日", "dimanche", "Воскресенье"],

    // ---------- 音乐 ----------
    "播放进度": ["播放進度", "Playback progress", "再生位置", "Progression de lecture", "Позиция воспроизведения"],
    "上一首": ["上一首", "Previous", "前へ", "Précédent", "Предыдущий"],
    "下一首": ["下一首", "Next", "次へ", "Suivant", "Следующий"],
    "播放": ["播放", "Play", "再生", "Lecture", "Играть"],
    "正在播放": ["正在播放", "Now playing", "再生中", "En lecture", "Сейчас играет"],
    "未在播放": ["未在播放", "Nothing playing", "再生していません", "Aucune lecture", "Ничего не играет"],

    // ---------- 随手记 ----------
    "写好后保存到本机": ["寫好後儲存到本機", "Saved on this device", "書き終えたら保存", "Enregistré sur cet appareil", "Сохраняется на этом устройстве"],
    "准备就绪": ["準備就緒", "Ready", "準備完了", "Prêt", "Готово"],
    "随手记翻页": ["隨手記翻頁", "Note pagination", "メモのページ送り", "Pagination des notes", "Перелистывание заметок"],
    "上一页": ["上一頁", "Previous page", "前のページ", "Page précédente", "Предыдущая страница"],
    "下一页": ["下一頁", "Next page", "次のページ", "Page suivante", "Следующая страница"],
    "随手写下一点什么…": ["隨手寫下一點什麼…", "Jot something down…", "何か書き留めて…", "Notez quelque chose…", "Запишите что-нибудь…"],
    "随手记内容": ["隨手記內容", "Note content", "メモの内容", "Contenu de la note", "Содержимое заметки"],
    "草稿会自动保留": ["草稿會自動保留", "Drafts are kept", "下書きは自動保存", "Le brouillon est conservé", "Черновик сохраняется"],
    "最近保存的 5 条": ["最近儲存的 5 條", "Last 5 saved", "最近保存した 5 件", "5 dernières notes", "Последние 5 записей"],
    "还没有保存过随手记。": ["還沒有儲存過隨手記。", "No notes saved yet.", "まだメモがありません。", "Aucune note enregistrée.", "Заметок пока нет."],
    "更多记录": ["更多記錄", "More notes", "さらに表示", "Plus de notes", "Больше записей"],
    "无标题随手记": ["無標題隨手記", "Untitled note", "無題のメモ", "Note sans titre", "Заметка без названия"],

    // ---------- 剪贴板 ----------
    "自动记录最近复制的文字": ["自動記錄最近複製的文字", "Keeps your recent copies", "最近コピーした文字を自動記録", "Enregistre vos copies récentes", "Сохраняет недавние копии"],
    "还没有记录。复制文字后会自动出现在这里。": ["還沒有記錄。複製文字後會自動出現在這裡。", "No entries yet. Copy some text and it will show up here.", "まだ記録がありません。コピーするとここに表示されます。", "Aucune entrée. Copiez du texte pour le voir ici.", "Пока пусто. Скопируйте текст, и он появится здесь."],
    "点击记录重新复制 · 右键删除": ["點擊記錄重新複製 · 右鍵刪除", "Click to copy again · Right-click to delete", "クリックで再コピー・右クリックで削除", "Cliquez pour recopier · Clic droit pour supprimer", "Щелчок — скопировать снова · ПКМ — удалить"],
    "最近复制": ["最近複製", "Recently copied", "最近コピー", "Copié récemment", "Недавно скопировано"],
    "暂无内容": ["暫無內容", "Nothing yet", "内容なし", "Aucun contenu", "Пусто"],

    // ---------- 快速收纳 ----------
    "临时中转": ["臨時中轉", "Temporary", "一時置き場", "Temporaire", "Временное"],
    "把文件拖到这里临时中转；文件仍保留在原来的位置。": ["把檔案拖到這裡臨時中轉；檔案仍保留在原來的位置。", "Drop files here to hold them temporarily; originals stay where they are.", "ファイルをここにドロップすると一時的に預かれます。元の場所は変わりません。", "Déposez des fichiers ici pour les garder temporairement ; les originaux ne bougent pas.", "Перетащите файлы сюда, чтобы временно их удержать; оригиналы останутся на месте."],
    "暂无收纳": ["暫無收納", "Nothing stored", "収納なし", "Rien de stocké", "Ничего не собрано"],

    // ---------- 待办 ----------
    "添加任务，按回车确认": ["新增任務，按 Enter 確認", "Add a task and press Enter", "タスクを追加して Enter で確定", "Ajoutez une tâche puis appuyez sur Entrée", "Добавьте задачу и нажмите Enter"],
    "新待办内容": ["新待辦內容", "New task", "新しいタスク", "Nouvelle tâche", "Новая задача"],
    "添加": ["新增", "Add", "追加", "Ajouter", "Добавить"],
    "还没有待办，先写下一件小事吧。": ["還沒有待辦，先寫下一件小事吧。", "No tasks yet — start with something small.", "まだタスクがありません。小さなことから始めましょう。", "Aucune tâche. Commencez par une petite chose.", "Задач пока нет. Начните с малого."],
    "查看全部": ["查看全部", "View all", "すべて表示", "Tout voir", "Показать все"],
    "查看全部待办": ["查看全部待辦", "View all tasks", "すべてのタスク", "Toutes les tâches", "Все задачи"],
    "待办": ["待辦", "Tasks", "タスク", "Tâches", "Задачи"],
    "未命名待办": ["未命名待辦", "Untitled task", "無題のタスク", "Tâche sans titre", "Задача без названия"],
    "暂无未完成": ["暫無未完成", "All clear", "未完了なし", "Tout est fait", "Всё выполнено"],
    "删除待办": ["刪除待辦", "Delete task", "タスクを削除", "Supprimer la tâche", "Удалить задачу"],

    // ---------- 日历 ----------
    "有未完成待办的日期会显示橙点": ["有未完成待辦的日期會顯示橙點", "Dates with open tasks show an orange dot", "未完了タスクのある日にオレンジの点が付きます", "Les jours avec des tâches affichent un point orange", "Дни с задачами отмечены оранжевой точкой"],
    "今天": ["今天", "Today", "今日", "Aujourd'hui", "Сегодня"],
    "一": ["一", "Mon", "月", "L", "Пн"],
    "二": ["二", "Tue", "火", "M", "Вт"],
    "三": ["三", "Wed", "水", "M", "Ср"],
    "四": ["四", "Thu", "木", "J", "Чт"],
    "五": ["五", "Fri", "金", "V", "Пт"],
    "六": ["六", "Sat", "土", "S", "Сб"],
    "日": ["日", "Sun", "日", "D", "Вс"],
    "当月日历": ["當月日曆", "This month", "今月のカレンダー", "Calendrier du mois", "Календарь месяца"],
    "点击日期翻面查看当天待办": ["點擊日期翻面查看當天待辦", "Click a date to flip and see its tasks", "日付をクリックするとその日のタスクが見られます", "Cliquez sur une date pour voir ses tâches", "Нажмите на дату, чтобы увидеть задачи"],
    "← 返回月历": ["← 返回月曆", "← Back to month", "← 月表示に戻る", "← Retour au mois", "← К месяцу"],
    "当天待办": ["當天待辦", "Tasks for the day", "その日のタスク", "Tâches du jour", "Задачи на день"],
    "所选日期的待办": ["所選日期的待辦", "Tasks on the selected date", "選択した日のタスク", "Tâches de la date choisie", "Задачи на выбранную дату"],
    "这一天还没有待办。从「任务待办」拖一个任务到这里。": ["這一天還沒有待辦。從「任務待辦」拖一個任務到這裡。", "Nothing scheduled for this day. Drag a task here from the Tasks widget.", "この日のタスクはありません。「タスク」からここにドラッグしてください。", "Rien de prévu ce jour-là. Glissez une tâche depuis le widget Tâches.", "На этот день задач нет. Перетащите задачу из виджета «Задачи»."],
    "勾选即可完成 · 把待办拖到日期上即可安排": ["勾選即可完成 · 把待辦拖到日期上即可安排", "Check to complete · Drag a task onto a date to schedule it", "チェックで完了・日付にドラッグで予定化", "Cochez pour terminer · Glissez une tâche sur une date", "Отметьте, чтобы завершить · Перетащите задачу на дату"],

    // ---------- 番茄钟 ----------
    "专注时间": ["專注時間", "Focus", "集中時間", "Concentration", "Фокус"],
    "休息时间": ["休息時間", "Break", "休憩時間", "Pause", "Перерыв"],
    "准备专注": ["準備專注", "Ready to focus", "集中の準備", "Prêt à vous concentrer", "Готов к фокусу"],
    "准备休息": ["準備休息", "Ready for a break", "休憩の準備", "Prêt pour une pause", "Готов к перерыву"],
    "专注中": ["專注中", "Focusing", "集中中", "En concentration", "В фокусе"],
    "休息中": ["休息中", "On a break", "休憩中", "En pause", "Перерыв"],
    "已暂停": ["已暫停", "Paused", "一時停止中", "En pause", "Пауза"],
    "继续": ["繼續", "Resume", "再開", "Reprendre", "Продолжить"],
    "开始": ["開始", "Start", "開始", "Démarrer", "Старт"],
    "暂停": ["暫停", "Pause", "一時停止", "Pause", "Пауза"],
    "重置": ["重置", "Reset", "リセット", "Réinitialiser", "Сброс"],
    "专注 25 分钟 · 休息 5 分钟": ["專注 25 分鐘 · 休息 5 分鐘", "Focus 25 min · Break 5 min", "集中 25 分 · 休憩 5 分", "Concentration 25 min · Pause 5 min", "Фокус 25 мин · Перерыв 5 мин"],
    "休息 5 分钟 · 之后继续专注": ["休息 5 分鐘 · 之後繼續專注", "Break 5 min · Then focus again", "休憩 5 分 · その後また集中", "Pause 5 min · Puis on reprend", "Перерыв 5 мин · Затем снова фокус"],
    "专注结束，休息 5 分钟吧。": ["專注結束，休息 5 分鐘吧。", "Focus done. Take a 5-minute break.", "集中終了。5 分休憩しましょう。", "Concentration terminée. Pause de 5 minutes.", "Фокус завершён. Отдохните 5 минут."],
    "休息结束，开始下一轮专注吧。": ["休息結束，開始下一輪專注吧。", "Break over — time for the next round.", "休憩終了。次の集中を始めましょう。", "Pause terminée. Reprenons.", "Перерыв окончен. Начинаем новый круг."],
    "目标": ["目標", "Goal", "目標", "Objectif", "Цель"],
    "清除专注目标": ["清除專注目標", "Clear focus goal", "集中目標をクリア", "Effacer l'objectif", "Сбросить цель"],
    "开始番茄钟": ["開始番茄鐘", "Start pomodoro", "ポモドーロ開始", "Démarrer le pomodoro", "Запустить помодоро"],
    "暂停番茄钟": ["暫停番茄鐘", "Pause pomodoro", "ポモドーロ一時停止", "Mettre le pomodoro en pause", "Приостановить помодоро"],
    "专注目标": ["專注目標", "Focus goal", "集中目標", "Objectif de concentration", "Цель фокуса"],

    // ---------- 快速搜索 ----------
    "搜索桌面与分类文件": ["搜尋桌面與分類檔案", "Search desktop and categories", "デスクトップと分類を検索", "Rechercher sur le bureau et dans les catégories", "Поиск по рабочему столу и категориям"],
    "输入文件名，或把文件拖进来": ["輸入檔名，或把檔案拖進來", "Type a file name, or drop a file here", "ファイル名を入力、またはファイルをドロップ", "Saisissez un nom ou déposez un fichier", "Введите имя файла или перетащите файл"],
    "搜索文件": ["搜尋檔案", "Search files", "ファイルを検索", "Rechercher des fichiers", "Поиск файлов"],
    "搜索": ["搜尋", "Search", "検索", "Rechercher", "Поиск"],
    "输入名称搜索桌面、分类和快速收纳中的文件；拖入文件会自动填入文件名。": ["輸入名稱搜尋桌面、分類和快速收納中的檔案；拖入檔案會自動填入檔名。", "Search the desktop, categories and Quick Drop; dropping a file fills in its name.", "デスクトップ・分類・一時置き場を検索。ファイルをドロップすると名前が入ります。", "Recherchez sur le bureau, dans les catégories et le dépôt ; un fichier déposé remplit son nom.", "Поиск по рабочему столу, категориям и временному хранилищу; перетащенный файл подставит имя."],
    "松开填入文件名": ["放開以填入檔名", "Drop to fill in the name", "ドロップしてファイル名を入力", "Relâchez pour remplir le nom", "Отпустите, чтобы подставить имя"],
    "松开生成图文卡片": ["放開以產生圖文卡片", "Drop to create a note card", "ドロップしてカードを作成", "Relâchez pour créer une note", "Отпустите, чтобы создать карточку"],
    "松开生成待办任务": ["放開以產生待辦任務", "Drop to create a task", "ドロップしてタスクを作成", "Relâchez pour créer une tâche", "Отпустите, чтобы создать задачу"],
    "松开加入快速收纳": ["放開以加入快速收納", "Drop to add to Quick Drop", "ドロップして一時置き場へ", "Relâchez pour ajouter au dépôt", "Отпустите, чтобы добавить"],
    "松开设定专注目标": ["放開以設定專注目標", "Drop to set the focus goal", "ドロップして集中目標を設定", "Relâchez pour définir l'objectif", "Отпустите, чтобы задать цель"],

    // ---------- 引导 / 成就提示 ----------
    "桌面组件": ["桌面元件", "Desktop widgets", "デスクトップウィジェット", "Widgets du bureau", "Виджеты рабочего стола"],
    "未整理桌面文件": ["未整理桌面檔案", "Unsorted desktop files", "未整理のデスクトップファイル", "Fichiers non classés", "Неразобранные файлы"],
    "桌面渲染层": ["桌面渲染層", "Desktop layer", "デスクトップレイヤー", "Couche bureau", "Слой рабочего стола"],
    "🏆 成就达成": ["🏆 成就達成", "🏆 Achievement unlocked", "🏆 実績達成", "🏆 Succès débloqué", "🏆 Достижение получено"],
    "方寸格 · 新手引导": ["方寸格 · 新手引導", "Within Cubes · Tour", "方寸格 · チュートリアル", "Within Cubes · Visite guidée", "Within Cubes · Обучение"],
    "上一步": ["上一步", "Back", "前へ", "Précédent", "Назад"],
    "下一步": ["下一步", "Next", "次へ", "Suivant", "Далее"],
    "跳过引导": ["跳過引導", "Skip tour", "スキップ", "Passer la visite", "Пропустить"],
    "开始体验（下一步）": ["開始體驗（下一步）", "Start (next)", "はじめる（次へ）", "Commencer (suivant)", "Начать (далее)"],

    // ---------- 右键菜单常用项 ----------
    "打开": ["開啟", "Open", "開く", "Ouvrir", "Открыть"],
    "复制": ["複製", "Copy", "コピー", "Copier", "Копировать"],
    "剪切": ["剪下", "Cut", "切り取り", "Couper", "Вырезать"],
    "删除": ["刪除", "Delete", "削除", "Supprimer", "Удалить"],
    "属性": ["內容", "Properties", "プロパティ", "Propriétés", "Свойства"],
    "打开方式": ["開啟方式", "Open with", "プログラムから開く", "Ouvrir avec", "Открыть с помощью"],
    "重命名": ["重新命名", "Rename", "名前の変更", "Renommer", "Переименовать"],
    "复制文件路径": ["複製檔案路徑", "Copy file path", "ファイルパスをコピー", "Copier le chemin", "Копировать путь"],
    "在文件夹中显示": ["在資料夾中顯示", "Show in folder", "フォルダーで表示", "Afficher dans le dossier", "Показать в папке"],

    // ---------- 高频操作提示 ----------
    "已复制": ["已複製", "Copied", "コピーしました", "Copié", "Скопировано"],
    "已复制到剪贴板": ["已複製到剪貼簿", "Copied to clipboard", "クリップボードにコピーしました", "Copié dans le presse-papiers", "Скопировано в буфер обмена"],
    "已保存并清空输入框": ["已儲存並清空輸入框", "Saved and cleared", "保存して入力をクリアしました", "Enregistré et champ vidé", "Сохранено, поле очищено"],
    "已加入快速收纳": ["已加入快速收納", "Added to Quick Drop", "一時置き場に追加しました", "Ajouté au dépôt", "Добавлено во временное хранилище"],
    "已从快速收纳移除": ["已從快速收納移除", "Removed from Quick Drop", "一時置き場から削除しました", "Retiré du dépôt", "Удалено из временного хранилища"],
    "已移入分类": ["已移入分類", "Moved to a category", "分類に移動しました", "Déplacé dans une catégorie", "Перемещено в категорию"],
    "已展开": ["已展開", "Expanded", "展開しました", "Déployé", "Развёрнуто"],
    "已收起": ["已收合", "Collapsed", "折りたたみました", "Replié", "Свёрнуто"],
    "已取消文件夹映射": ["已取消資料夾對應", "Folder mapping removed", "フォルダーの対応を解除しました", "Association de dossier retirée", "Связь с папкой снята"],
    "文件夹映射已保存": ["資料夾對應已儲存", "Folder mapping saved", "フォルダーの対応を保存しました", "Association de dossier enregistrée", "Связь с папкой сохранена"]
  };

  const LOCALES = ["zh-TW", "en", "ja", "fr", "ru"];
  const packs = {
    "zh-CN": Object.fromEntries(
      Object.keys(ENTRIES).map((source) => [source, source])
    )
  };

  for (let index = 0; index < LOCALES.length; index += 1) {
    const locale = LOCALES[index];
    const dictionary = {};

    for (const [source, values] of Object.entries(ENTRIES)) {
      if (values[index]) dictionary[source] = values[index];
    }

    packs[locale] = dictionary;
  }

  // 与主窗口语言包合并，而不是覆盖：同名条以桌面层为准。
  window.__WITHIN_LOCALES__ = window.__WITHIN_LOCALES__ || {};

  for (const [locale, dictionary] of Object.entries(packs)) {
    window.__WITHIN_LOCALES__[locale] = Object.assign(
      {},
      window.__WITHIN_LOCALES__[locale] || {},
      dictionary
    );
  }
})();
