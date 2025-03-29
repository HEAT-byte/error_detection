import os
import numpy as np
import pandas as pd
from sklearn.cluster import DBSCAN
import matplotlib.pyplot as plt
import matplotlib.ticker as ticker

# 定义汉字月份与数字的映射
month_mapping = {
    "一月": "01", "二月": "02", "三月": "03", "四月": "04",
    "五月": "05", "六月": "06", "七月": "07", "八月": "08",
    "九月": "09", "十月": "10", "十一月": "11", "十二月": "12"
}

def merge_xlsx_files_in_folder(month_folder):
    """
    合并指定月份文件夹内所有xlsx文件的数据，并将csv保存在同一文件夹。
    :param month_folder: 月份文件夹的路径（文件夹名称为汉字月份，如"七月"）
    """
    # 提取月份的汉字部分，并映射到数字月份
    # 检查输出文件是否已存在
    month_name = os.path.basename(month_folder).strip()
    month_num = month_mapping.get(month_name, "未知")

    if month_num == "未知":
        print(f"无法识别的月份名称: {month_name}")
        return

    output_file = os.path.join(month_folder, f"2022-{month_num}.csv")

    if os.path.exists(output_file):
        print(f"文件 {output_file} 已存在，跳过合并。")
        return

    # 查找文件夹中的所有xlsx文件
    all_files = [
        os.path.join(month_folder, f)
        for f in os.listdir(month_folder) if f.endswith(".xlsx")
    ]

    # 使用列表存储所有数据框
    data_frames = []

    for file in all_files:
        try:
            # 读取xlsx文件，并假设列头一致
            df = pd.read_excel(file)
            data_frames.append(df)
        except Exception as e:
            print(f"Error reading {file}: {e}")

    if data_frames:
        # 拼接所有数据框
        merged_df = pd.concat(data_frames, ignore_index=True)

        # 将拼接后的数据保存为csv
        merged_df.to_csv(output_file, index=False, encoding='utf-8-sig')
        print(f"数据已保存到 {output_file}")
    else:
        print(f"未找到有效的xlsx文件在文件夹 {month_folder} 中。")

def DBScan(x):
    """
    DBScan异常检测
    :param x: 输入的索力数据 应为 list 格式
    :return: 返回异常值索引
    """
    counts, edges = np.histogram(x, bins='auto')
    cidx = np.where(counts > 0)[0]
    intv = np.mean(np.diff(edges))
    md = [[] for _ in range(len(cidx) - 1)]
    stdd = [[] for _ in range(len(cidx) - 1)]
    for m in range(len(cidx) - 1):  # 此处需检查
        kk1 = edges[cidx[m]]
        kk2 = edges[cidx[m + 1]]
        mask = np.logical_and(x <= kk2, x >= kk1)
        mask1 = np.where(mask == True)[0]
        dd = [x[a] for a in mask1]
        md[m] = np.mean(dd)
        stdd[m] = np.std(dd)

    if len(cidx) > 1:
        dis = np.diff(edges[cidx]) - intv
        if np.mean(dis) == 0:
            dis = 0
    else:
        dis = 0

    mm = np.where(dis > 0)[0]

    if len(mm) > 0:
        epsilon = dis[mm[0]]
    else:
        epsilon = intv / 2

    if epsilon < 100:
        epsilon = 100

    minpts = 1
    x_2d = np.array(x).reshape(-1, 1)
    dbscan_model = DBSCAN(eps=epsilon, min_samples=minpts).fit(x_2d)
    classidx = dbscan_model.labels_

    counts1, edges1 = np.histogram(classidx, bins=np.arange(classidx.min(), classidx.max() + 2))
    Normclass = np.ceil(edges1[np.where(counts1 > 0.5 * len(x))])

    L_idx1 = np.where(classidx == Normclass)[0]
    L_idx2 = np.where(classidx != Normclass)[0]

    classidx[L_idx1] = 1
    classidx[L_idx2] = 2

    error = np.where(classidx == 2)[0]
    return error

def DECT_single_SL_figure_show(SLData, sensor_id, error_index):
    # 更改
    SL_M = SLData.M_RESULT.tolist()
    SLData['MDATE'] = pd.to_datetime(SLData['MDATE'])
    SL_date = SLData['MDATE'].dt.date
    # 【已成功】只保留日期去掉时间 在x轴显示时不出现时刻

    fig = plt.figure(figsize=(10, 6))
    plt.rcParams['font.family'] = 'Microsoft YaHei'
    plt.rcParams['font.size'] = 10
    ax = fig.add_subplot(1, 1, 1)

    # 更改 时间间隔去掉了
    ar_xticks = np.arange(1, len(SL_date) + 1, step=1)
    plt.xticks(ar_xticks, SL_date, rotation=45, fontsize=10)
    ax.plot(ar_xticks, SL_M, linewidth=1)
    # 更改 不会空数据 连续数据

    ax.set_xlabel("Date")
    ax.set_ylabel("SLData")
    ax.set_title(sensor_id)
    for error in error_index:
        ax.scatter(ar_xticks[error], SL_M[error], c="r")
    tick_spacing = 12
    ax.xaxis.set_major_locator(ticker.MultipleLocator(tick_spacing))
    fig.tight_layout()
    plt.show()

if __name__ == "__main__":
    # 读取表格数据为df并按照时间顺序对表格内容进行排序
    month_folder_path = r"C:\DBSCAN方法\marked\七月"  # 修改为实际路径
    merge_xlsx_files_in_folder(month_folder_path)
    # file_path = r"C:\DBSCAN方法\marked\七月\2022-07.csv"
    # plot_month = 1  # 单月绘图  0-不显示 1-显示
    # plot_day = 0  # 单天绘图 0-不显示 1-显示
    #
    # df = pd.read_csv(file_path, encoding='utf-8')
    # df['MDATE'] = pd.to_datetime(df['MDATE'])
    # df = df.sort_values(by=['MDATE'], ascending=True).reset_index(drop=True)
    #
    # """
    # 可修改SLnum调节索力个数进行中间测试
    # """
    # SLnum = 48
    # """
    # 此时遍历48个数字将索力名称存储完成 后续可直接使用（画图已经提取索力数据处可以进行更改）
    # """
    # SLname = []
    # for i in range(0, 48):
    #     if i <= 8:
    #         name = 'SLS0' + str(i + 1)
    #     elif i <= 23:
    #         name = 'SLS' + str(i + 1)
    #     elif i <= 32:
    #         name = 'SLX0' + str(i - 23)
    #     else:
    #         name = 'SLX' + str(i - 23)
    #     SLname.append(name)
    # SLData = []
    # SL_M = []
    # SL_date = []
    # # array_2d = [[0] * 48 for _ in range(12)]
    # for i in range(1, SLnum + 1):  # 遍历所有索力 (这一行和下一行只能一行有效 一行注释使用)
    # # for i in range(17, 18):  # 测试点：单索力(测试时将上一行注释掉) eg.SLS01-range(1, 2） SLX01-range(25, 26)
    #     if i <= 9:
    #         name = 'SLS0' + str(i)  # 以下同理 根据命名方式进行查找记录索引值
    #         df_sel = df.loc[df['SENSOR_ID'] == name, ['MDATE', 'SENSOR_ID', 'M_RESULT']]
    #     elif i <= SLnum / 2:
    #         name = 'SLS' + str(i)
    #         df_sel = df.loc[df['SENSOR_ID'] == name, ['MDATE', 'SENSOR_ID', 'M_RESULT']]
    #     elif i <= SLnum / 2 + 9:
    #         name = 'SLX0' + str(i - int(SLnum / 2))
    #         df_sel = df.loc[df['SENSOR_ID'] == name, ['MDATE', 'SENSOR_ID', 'M_RESULT']]
    #     elif i <= SLnum:
    #         name = 'SLX' + str(i - int(SLnum / 2))
    #         df_sel = df.loc[df['SENSOR_ID'] == name, ['MDATE', 'SENSOR_ID', 'M_RESULT']]
    #     SLData = df_sel
    #     SLData = SLData.reset_index(drop=True)  # 对于时间排序后的数据 提取出的单个索力的所有数据 并重新赋索引值
    #
    #     SLdata_list = SLData['M_RESULT'].to_list()
    #
    #     # DBScan部分
    #     error_index = DBScan(x=SLdata_list)
    #     DECT_single_SL_figure_show(SLData=SLData, sensor_id=SLname[i - 1], error_index=error_index)


