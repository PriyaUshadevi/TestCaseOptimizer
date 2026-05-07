import pandas as pd

def load_test_cases(file_path):
    return pd.read_excel(file_path)

def find_duplicates(df, column_name):
    duplicates = df[df.duplicated(subset=[column_name], keep=False)]
    return duplicates

def main():
    file_path = "test_cases.xlsx"  # sample file
    df = load_test_cases(file_path)

    print("Total Test Cases:", len(df))

    duplicates = find_duplicates(df, "Test Case Name")

    print("\nDuplicate Test Cases Found:")
    print(duplicates)

if __name__ == "__main__":
    main()