import pandas as pd


DEFAULT_INPUT_FILE = "test_cases.xlsx"


def load_test_cases(file_path):
    return pd.read_excel(file_path)


def find_name_column(df):
    for column_name in ["Test Case Name", "Summary", "Name", "Title"]:
        if column_name in df.columns:
            return column_name
    raise ValueError(
        "Missing a test case name column. Expected one of: "
        "Test Case Name, Summary, Name, Title."
    )


def find_duplicates(df, column_name):
    duplicates = df[df.duplicated(subset=[column_name], keep=False)]
    return duplicates


def main():
    file_path = DEFAULT_INPUT_FILE
    df = load_test_cases(file_path)
    name_column = find_name_column(df)

    print("Total Test Cases:", len(df))

    duplicates = find_duplicates(df, name_column)

    print("\nDuplicate Test Cases Found:")
    if duplicates.empty:
        print("None")
    else:
        print(duplicates)


if __name__ == "__main__":
    main()
