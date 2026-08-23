import xgboost as xgb
import re

booster = xgb.Booster()
booster.load_model('model/final_risk_model.json')
dump = booster.get_dump()

features_to_check = ['ProductCD', 'card4', 'card5', 'P_emaildomain', 'TransactionAmt', 'card1', 'card2']
with open('inspect_output.txt', 'w') as f_out:
    for f in features_to_check:
        f_out.write(f'=== Splits for {f} ===\n')
        matches = []
        for tree_idx, tree in enumerate(dump):
            for line in tree.split('\n'):
                if f in line:
                    matches.append((tree_idx, line.strip()))
        for m in matches[:15]:
            f_out.write(f'Tree {m[0]}: {m[1]}\n')
print("Done inspecting")
