using Application.DTOs.Assets;
using FluentValidation;

namespace Application.Validators;

public class CreateAssetRequestValidator : AbstractValidator<CreateAssetRequest>
{
    public CreateAssetRequestValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Asset name is required.")
            .MaximumLength(200).WithMessage("Asset name must not exceed 200 characters.");

        RuleFor(x => x.CategoryId)
            .NotEmpty().WithMessage("Category is required.");

        RuleFor(x => x.OrganizationUnitId)
            .NotEmpty().WithMessage("Organization unit is required.");

        RuleFor(x => x.PurchaseCost)
            .GreaterThanOrEqualTo(0).When(x => x.PurchaseCost.HasValue)
            .WithMessage("Purchase cost must be a positive value.");
    }
}

public class UpdateAssetRequestValidator : AbstractValidator<UpdateAssetRequest>
{
    public UpdateAssetRequestValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Asset name is required.")
            .MaximumLength(200).WithMessage("Asset name must not exceed 200 characters.");

        RuleFor(x => x.Status)
            .IsInEnum().WithMessage("Invalid asset status.");

        RuleFor(x => x.CategoryId)
            .NotEmpty().WithMessage("Category is required.");

        RuleFor(x => x.OrganizationUnitId)
            .NotEmpty().WithMessage("Organization unit is required.");

        RuleFor(x => x.PurchaseCost)
            .GreaterThanOrEqualTo(0).When(x => x.PurchaseCost.HasValue)
            .WithMessage("Purchase cost must be a positive value.");
    }
}

public class AssignAssetRequestValidator : AbstractValidator<AssignAssetRequest>
{
    public AssignAssetRequestValidator()
    {
        RuleFor(x => x.OrganizationUnitId)
            .NotEmpty().WithMessage("Organization unit is required.");
    }
}
